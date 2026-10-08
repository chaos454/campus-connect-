-- Campus Connect — full database setup (run once in Supabase SQL Editor)
-- Generated: 2026-10-08

-- ===== 0000_migration =====
CREATE TABLE public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text NOT NULL,
  city text,
  domain text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.colleges TO anon, authenticated;
GRANT ALL ON public.colleges TO service_role;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Colleges are public" ON public.colleges FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.college_for_email(_email text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id FROM public.colleges c
  WHERE lower(split_part(_email,'@',2)) = c.domain
     OR lower(split_part(_email,'@',2)) LIKE '%.' || c.domain
  ORDER BY length(c.domain) DESC LIMIT 1
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  college_id uuid NOT NULL REFERENCES public.colleges(id),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 80),
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,24}$'),
  branch text,
  year smallint CHECK (year BETWEEN 1 AND 6),
  bio text CHECK (char_length(bio) <= 300),
  interests text[] NOT NULL DEFAULT '{}',
  looking_for text[] NOT NULL DEFAULT '{}',
  relationship_status text,
  show_relationship boolean NOT NULL DEFAULT false,
  discoverable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_college_idx ON public.profiles(college_id);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Create own verified profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND college_id = public.college_for_email(auth.jwt()->>'email'));
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND college_id = public.college_for_email(auth.jwt()->>'email'));

CREATE OR REPLACE FUNCTION public.my_college()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT college_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.in_my_college(_profile uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _profile AND college_id = public.my_college())
$$;

CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id)
);
CREATE UNIQUE INDEX connections_pair_idx ON public.connections (LEAST(requester_id,addressee_id), GREATEST(requester_id,addressee_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read" ON public.connections FOR SELECT TO authenticated
  USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "Request same-college" ON public.connections FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND status = 'pending' AND public.in_my_college(addressee_id));
CREATE POLICY "Addressee accepts" ON public.connections FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid()) WITH CHECK (addressee_id = auth.uid() AND status = 'accepted');
CREATE POLICY "Either removes" ON public.connections FOR DELETE TO authenticated
  USING (auth.uid() IN (requester_id, addressee_id));

CREATE OR REPLACE FUNCTION public.campus_students(_search text DEFAULT NULL, _limit int DEFAULT 60)
RETURNS TABLE (id uuid, full_name text, username text, branch text, year smallint, bio text,
  interests text[], looking_for text[], relationship_status text, connection_status text, is_requester boolean, shared int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT COALESCE((SELECT interests FROM public.profiles WHERE id = auth.uid()), '{}'::text[]) AS i)
  SELECT p.id, p.full_name, p.username, p.branch, p.year, p.bio, p.interests, p.looking_for,
    CASE WHEN p.show_relationship THEN p.relationship_status END,
    c.status, (c.requester_id = auth.uid()),
    cardinality(ARRAY(SELECT unnest(p.interests) INTERSECT SELECT unnest(me.i)))::int AS shared
  FROM public.profiles p CROSS JOIN me
  LEFT JOIN public.connections c ON
    (c.requester_id = auth.uid() AND c.addressee_id = p.id) OR (c.addressee_id = auth.uid() AND c.requester_id = p.id)
  WHERE p.college_id = public.my_college() AND p.id <> auth.uid() AND p.discoverable
    AND (_search IS NULL OR _search = '' OR p.full_name ILIKE '%'||_search||'%' OR p.username ILIKE '%'||_search||'%'
      OR p.branch ILIKE '%'||_search||'%' OR EXISTS (SELECT 1 FROM unnest(p.interests) x WHERE x ILIKE '%'||_search||'%'))
  ORDER BY shared DESC, p.created_at DESC
  LIMIT LEAST(_limit, 100)
$$;

CREATE OR REPLACE FUNCTION public.campus_student(_username text)
RETURNS TABLE (id uuid, full_name text, username text, branch text, year smallint, bio text,
  interests text[], looking_for text[], relationship_status text, connection_status text, is_requester boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.username, p.branch, p.year, p.bio, p.interests, p.looking_for,
    CASE WHEN p.show_relationship THEN p.relationship_status END,
    c.status, (c.requester_id = auth.uid())
  FROM public.profiles p
  LEFT JOIN public.connections c ON
    (c.requester_id = auth.uid() AND c.addressee_id = p.id) OR (c.addressee_id = auth.uid() AND c.requester_id = p.id)
  WHERE p.college_id = public.my_college() AND p.username = lower(_username)
$$;

CREATE OR REPLACE FUNCTION public.my_connections()
RETURNS TABLE (connection_id uuid, status text, incoming boolean, id uuid, full_name text, username text, branch text, year smallint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.status, c.addressee_id = auth.uid(), p.id, p.full_name, p.username, p.branch, p.year
  FROM public.connections c
  JOIN public.profiles p ON p.id = CASE WHEN c.requester_id = auth.uid() THEN c.addressee_id ELSE c.requester_id END
  WHERE auth.uid() IN (c.requester_id, c.addressee_id)
  ORDER BY c.created_at DESC
$$;

REVOKE EXECUTE ON FUNCTION public.campus_students(text,int), public.campus_student(text), public.my_connections(), public.in_my_college(uuid), public.my_college(), public.college_for_email(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.campus_students(text,int), public.campus_student(text), public.my_connections(), public.in_my_college(uuid), public.my_college(), public.college_for_email(text) TO authenticated;

INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('Indian Institute of Technology Bombay','IIT Bombay','Mumbai','iitb.ac.in'),
 ('Indian Institute of Technology Delhi','IIT Delhi','New Delhi','iitd.ac.in'),
 ('Indian Institute of Technology Kharagpur','IIT Kharagpur','Kharagpur','iitkgp.ac.in'),
 ('Jadavpur University','JU','Kolkata','jaduniv.edu.in'),
 ('BITS Pilani','BITS','Pilani','pilani.bits-pilani.ac.in'),
 ('Delhi Technological University','DTU','New Delhi','dtu.ac.in'),
 ('Stanford University','Stanford','Stanford','stanford.edu'),
 ('Massachusetts Institute of Technology','MIT','Cambridge','mit.edu');

INSERT INTO public.profiles (id, college_id, full_name, username, branch, year, bio, interests, looking_for, relationship_status, show_relationship)
SELECT gen_random_uuid(), c.id, d.n, d.u || '_' || c.slug, d.b, d.y, d.bio, d.i, d.l, d.r, d.r IS NOT NULL
FROM (SELECT id, lower(regexp_replace(short_name,'[^A-Za-z]','','g')) AS slug FROM public.colleges WHERE domain IN ('iitb.ac.in','jaduniv.edu.in')) c
CROSS JOIN (VALUES
 ('Aarav Mehta','aarav','Computer Science',3,'Building a tiny compiler for fun. Always up for a hackathon.',ARRAY['AI/ML','Hackathons','Open Source'],ARRAY['Hackathon team','Project collaborators'],NULL),
 ('Diya Sen','diya','Electrical Engineering',2,'Robotics club, chai, and long walks to the lake.',ARRAY['Robotics','Photography','Music'],ARRAY['Friends','Club members'],'Single'),
 ('Kabir Rao','kabir','Mechanical Engineering',4,'Formula Student team lead. Looking for designers.',ARRAY['Design','Robotics','Fitness'],ARRAY['Project collaborators'],NULL),
 ('Ananya Iyer','ananya','Mathematics',1,'New here! Into chess, puzzles and research.',ARRAY['Research','Reading','Chess'],ARRAY['Study group','Friends'],NULL),
 ('Rohan Das','rohan','Computer Science',2,'Frontend dev, design nerd, part-time DJ.',ARRAY['Web Dev','Design','Music'],ARRAY['Hackathon team','Friends'],'In a relationship'),
 ('Meera Kapoor','meera','Economics',3,'Running the finance club. Ask me about markets.',ARRAY['Finance','Business','Debate'],ARRAY['Club members','Mentorship'],NULL),
 ('Ishaan Gupta','ishaan','Chemical Engineering',4,'Climate tech + startups. Coffee is my personality.',ARRAY['Startups','Climate','Research'],ARRAY['Co-founder','Project collaborators'],NULL),
 ('Sara Khan','sara','Design',2,'Illustrator and UX student. Will draw your poster.',ARRAY['Design','Art','Movies'],ARRAY['Project collaborators','Friends'],'Single'),
 ('Vikram Nair','vikram','Physics',5,'PhD-curious. Astronomy club nights every Friday.',ARRAY['Astronomy','Research','Travel'],ARRAY['Study group'],NULL),
 ('Tara Bose','tara','Computer Science',1,'Learning ML from scratch. Need study buddies!',ARRAY['AI/ML','Reading','Fitness'],ARRAY['Study group','Hackathon team'],NULL),
 ('Arjun Pillai','arjun','Civil Engineering',3,'Football captain. Also into sustainable cities.',ARRAY['Sports','Climate','Travel'],ARRAY['Friends','Club members'],NULL),
 ('Nisha Reddy','nisha','Biotech',2,'Lab rat by day, poet by night.',ARRAY['Research','Writing','Music'],ARRAY['Friends','Study group'],NULL)
) AS d(n,u,b,y,bio,i,l,r);
-- ===== 0001_social_features =====
CREATE OR REPLACE FUNCTION public.campus_people(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, username text, branch text, year smallint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.username, p.branch, p.year FROM public.profiles p
  WHERE p.id = ANY(_ids) AND p.college_id = public.my_college()
$$;

CREATE OR REPLACE FUNCTION public.are_connected(_other uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.connections c WHERE c.status = 'accepted'
    AND ((c.requester_id = auth.uid() AND c.addressee_id = _other) OR (c.addressee_id = auth.uid() AND c.requester_id = _other)))
$$;

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_id uuid NOT NULL DEFAULT public.my_college() REFERENCES public.colleges(id),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campus reads posts" ON public.posts FOR SELECT TO authenticated USING (college_id = public.my_college());
CREATE POLICY "Write own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND college_id = public.my_college());
CREATE POLICY "Delete own posts" ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read likes" ON public.post_likes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "Like" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "Unlike" ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read comments" ON public.post_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "Comment" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "Delete own comment" ON public.post_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_pair_idx ON public.messages (sender_id, recipient_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read" ON public.messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "Message connections" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.are_connected(recipient_id));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL DEFAULT public.my_college() REFERENCES public.colleges(id),
  kind text NOT NULL CHECK (kind IN ('community','project','study')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description text CHECK (char_length(description) <= 1000),
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campus reads groups" ON public.groups FOR SELECT TO authenticated USING (college_id = public.my_college());
CREATE POLICY "Create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND college_id = public.my_college());
CREATE POLICY "Owner edits group" ON public.groups FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid() AND college_id = public.my_college());
CREATE POLICY "Owner deletes group" ON public.groups FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read members" ON public.group_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id));
CREATE POLICY "Join" ON public.group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id));
CREATE POLICY "Leave" ON public.group_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL DEFAULT public.my_college() REFERENCES public.colleges(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  description text CHECK (char_length(description) <= 2000),
  location text,
  starts_at timestamptz NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campus reads events" ON public.events FOR SELECT TO authenticated USING (college_id = public.my_college());
CREATE POLICY "Create events" ON public.events FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND college_id = public.my_college());
CREATE POLICY "Owner edits event" ON public.events FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid() AND college_id = public.my_college());
CREATE POLICY "Owner deletes event" ON public.events FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE public.event_rsvps (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read rsvps" ON public.event_rsvps FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id));
CREATE POLICY "RSVP" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id));
CREATE POLICY "Un-RSVP" ON public.event_rsvps FOR DELETE TO authenticated USING (user_id = auth.uid());
-- ===== 0002_india_colleges =====
-- Expand Indian college coverage and allow any official Indian academic email
-- (.ac.in, .edu.in, .res.in, .ernet.in) to resolve to a college row.

-- Major IITs
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('Indian Institute of Technology Madras', 'IIT Madras', 'Chennai', 'iitm.ac.in'),
 ('Indian Institute of Technology Kanpur', 'IIT Kanpur', 'Kanpur', 'iitk.ac.in'),
 ('Indian Institute of Technology Roorkee', 'IIT Roorkee', 'Roorkee', 'iitr.ac.in'),
 ('Indian Institute of Technology Guwahati', 'IIT Guwahati', 'Guwahati', 'iitg.ac.in'),
 ('Indian Institute of Technology Hyderabad', 'IIT Hyderabad', 'Hyderabad', 'iith.ac.in'),
 ('Indian Institute of Technology Indore', 'IIT Indore', 'Indore', 'iiti.ac.in'),
 ('Indian Institute of Technology BHU', 'IIT BHU', 'Varanasi', 'iitbhu.ac.in'),
 ('Indian Institute of Technology Ropar', 'IIT Ropar', 'Ropar', 'iitrpr.ac.in'),
 ('Indian Institute of Technology Mandi', 'IIT Mandi', 'Mandi', 'iitmandi.ac.in'),
 ('Indian Institute of Technology Gandhinagar', 'IIT Gandhinagar', 'Gandhinagar', 'iitgn.ac.in'),
 ('Indian Institute of Technology Jodhpur', 'IIT Jodhpur', 'Jodhpur', 'iitj.ac.in'),
 ('Indian Institute of Technology Patna', 'IIT Patna', 'Patna', 'iitp.ac.in'),
 ('Indian Institute of Technology Bhubaneswar', 'IIT Bhubaneswar', 'Bhubaneswar', 'iitbbs.ac.in'),
 ('Indian Institute of Technology Tirupati', 'IIT Tirupati', 'Tirupati', 'iittp.ac.in'),
 ('Indian Institute of Technology Palakkad', 'IIT Palakkad', 'Palakkad', 'iitpkd.ac.in'),
 ('Indian Institute of Technology Dhanbad', 'IIT ISM Dhanbad', 'Dhanbad', 'iitism.ac.in'),
 ('Indian Institute of Technology Jammu', 'IIT Jammu', 'Jammu', 'iitjammu.ac.in'),
 ('Indian Institute of Technology Bhilai', 'IIT Bhilai', 'Bhilai', 'iitbhilai.ac.in'),
 ('Indian Institute of Technology Goa', 'IIT Goa', 'Goa', 'iitgoa.ac.in'),
 ('Indian Institute of Technology Dharwad', 'IIT Dharwad', 'Dharwad', 'iitdh.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- NITs
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('National Institute of Technology Trichy', 'NIT Trichy', 'Tiruchirappalli', 'nitt.edu'),
 ('National Institute of Technology Karnataka', 'NITK Surathkal', 'Surathkal', 'nitk.edu.in'),
 ('National Institute of Technology Warangal', 'NIT Warangal', 'Warangal', 'nitw.ac.in'),
 ('National Institute of Technology Calicut', 'NIT Calicut', 'Calicut', 'nitc.ac.in'),
 ('National Institute of Technology Rourkela', 'NIT Rourkela', 'Rourkela', 'nitrkl.ac.in'),
 ('National Institute of Technology Durgapur', 'NIT Durgapur', 'Durgapur', 'nitdgp.ac.in'),
 ('National Institute of Technology Kurukshetra', 'NIT Kurukshetra', 'Kurukshetra', 'nitkkr.ac.in'),
 ('National Institute of Technology Jaipur', 'MNIT Jaipur', 'Jaipur', 'mnit.ac.in'),
 ('National Institute of Technology Allahabad', 'MNNIT Allahabad', 'Prayagraj', 'mnnit.ac.in'),
 ('National Institute of Technology Bhopal', 'MANIT Bhopal', 'Bhopal', 'manit.ac.in'),
 ('National Institute of Technology Jalandhar', 'NIT Jalandhar', 'Jalandhar', 'nitj.ac.in'),
 ('National Institute of Technology Hamirpur', 'NIT Hamirpur', 'Hamirpur', 'nith.ac.in'),
 ('National Institute of Technology Jamshedpur', 'NIT Jamshedpur', 'Jamshedpur', 'nitjsr.ac.in'),
 ('National Institute of Technology Patna', 'NIT Patna', 'Patna', 'nitp.ac.in'),
 ('National Institute of Technology Raipur', 'NIT Raipur', 'Raipur', 'nitrr.ac.in'),
 ('National Institute of Technology Silchar', 'NIT Silchar', 'Silchar', 'nits.ac.in'),
 ('National Institute of Technology Srinagar', 'NIT Srinagar', 'Srinagar', 'nitsri.ac.in'),
 ('National Institute of Technology Agartala', 'NIT Agartala', 'Agartala', 'nita.ac.in'),
 ('National Institute of Technology Meghalaya', 'NIT Meghalaya', 'Shillong', 'nitm.ac.in'),
 ('National Institute of Technology Goa', 'NIT Goa', 'Goa', 'nitgoa.ac.in'),
 ('National Institute of Technology Puducherry', 'NIT Puducherry', 'Puducherry', 'nitpy.ac.in'),
 ('National Institute of Technology Delhi', 'NIT Delhi', 'New Delhi', 'nitdelhi.ac.in'),
 ('National Institute of Technology Uttarakhand', 'NIT Uttarakhand', 'Srinagar Garhwal', 'nituk.ac.in'),
 ('National Institute of Technology Andhra Pradesh', 'NIT Andhra', 'Tadepalligudem', 'nitandhra.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- IIITs
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('International Institute of Information Technology Hyderabad', 'IIIT Hyderabad', 'Hyderabad', 'iiit.ac.in'),
 ('Indian Institute of Information Technology Allahabad', 'IIIT Allahabad', 'Prayagraj', 'iiita.ac.in'),
 ('ABV Indian Institute of Information Technology and Management', 'ABV-IIITM Gwalior', 'Gwalior', 'iiitm.ac.in'),
 ('Indian Institute of Information Technology Design and Manufacturing Kancheepuram', 'IIITDM Kancheepuram', 'Chennai', 'iiitdm.ac.in'),
 ('Indian Institute of Information Technology Design and Manufacturing Jabalpur', 'IIITDM Jabalpur', 'Jabalpur', 'iiitdmj.ac.in'),
 ('Indian Institute of Information Technology Bangalore', 'IIIT Bangalore', 'Bengaluru', 'iiitb.ac.in'),
 ('Indian Institute of Information Technology Guwahati', 'IIIT Guwahati', 'Guwahati', 'iiitg.ac.in'),
 ('Indian Institute of Information Technology Delhi', 'IIIT Delhi', 'New Delhi', 'iiitd.ac.in'),
 ('Indian Institute of Information Technology Lucknow', 'IIIT Lucknow', 'Lucknow', 'iiitl.ac.in'),
 ('Indian Institute of Information Technology Pune', 'IIIT Pune', 'Pune', 'iiitp.ac.in'),
 ('Indian Institute of Information Technology Kota', 'IIIT Kota', 'Kota', 'iiitkota.ac.in'),
 ('Indian Institute of Information Technology Una', 'IIIT Una', 'Una', 'iiitu.ac.in'),
 ('Indian Institute of Information Technology Sri City', 'IIIT Sri City', 'Sri City', 'iiits.ac.in'),
 ('Indian Institute of Information Technology Vadodara', 'IIIT Vadodara', 'Vadodara', 'iiitvadodara.ac.in'),
 ('Indian Institute of Information Technology Kalyani', 'IIIT Kalyani', 'Kalyani', 'iiitkalyani.ac.in'),
 ('Indian Institute of Information Technology Nagpur', 'IIIT Nagpur', 'Nagpur', 'iiitn.ac.in'),
 ('Indian Institute of Information Technology Ranchi', 'IIIT Ranchi', 'Ranchi', 'iiitranchi.ac.in'),
 ('Indian Institute of Information Technology Bhagalpur', 'IIIT Bhagalpur', 'Bhagalpur', 'iiitbh.ac.in'),
 ('Indian Institute of Information Technology Bhopal', 'IIIT Bhopal', 'Bhopal', 'iiitbhopal.ac.in'),
 ('Indian Institute of Information Technology Surat', 'IIIT Surat', 'Surat', 'iiitsurat.ac.in'),
 ('Indian Institute of Information Technology Agartala', 'IIIT Agartala', 'Agartala', 'iiitagartala.ac.in'),
 ('Indian Institute of Information Technology Dharwad', 'IIIT Dharwad', 'Dharwad', 'iiitdwd.ac.in'),
 ('Indian Institute of Information Technology Kottayam', 'IIIT Kottayam', 'Kottayam', 'iiitkottayam.ac.in'),
 ('Indian Institute of Information Technology Manipur', 'IIIT Manipur', 'Imphal', 'iiitmanipur.ac.in'),
 ('Indian Institute of Information Technology Tiruchirappalli', 'IIIT Trichy', 'Tiruchirappalli', 'iiitt.ac.in'),
 ('Indian Institute of Information Technology Sonepat', 'IIIT Sonepat', 'Sonepat', 'iiitsonepat.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- IISc, IISERs, NISER, ISI, etc.
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('Indian Institute of Science', 'IISc Bangalore', 'Bengaluru', 'iisc.ac.in'),
 ('Indian Institute of Science Education and Research Pune', 'IISER Pune', 'Pune', 'iiserpune.ac.in'),
 ('Indian Institute of Science Education and Research Kolkata', 'IISER Kolkata', 'Kolkata', 'iiserkol.ac.in'),
 ('Indian Institute of Science Education and Research Mohali', 'IISER Mohali', 'Mohali', 'iisermohali.ac.in'),
 ('Indian Institute of Science Education and Research Bhopal', 'IISER Bhopal', 'Bhopal', 'iiserb.ac.in'),
 ('Indian Institute of Science Education and Research Thiruvananthapuram', 'IISER TVM', 'Thiruvananthapuram', 'iisertvm.ac.in'),
 ('Indian Institute of Science Education and Research Tirupati', 'IISER Tirupati', 'Tirupati', 'iisertirupati.ac.in'),
 ('Indian Institute of Science Education and Research Berhampur', 'IISER Berhampur', 'Berhampur', 'iiserbpr.ac.in'),
 ('National Institute of Science Education and Research', 'NISER', 'Bhubaneswar', 'niser.ac.in'),
 ('Indian Statistical Institute', 'ISI Kolkata', 'Kolkata', 'isical.ac.in'),
 ('Indian Statistical Institute Bangalore', 'ISI Bangalore', 'Bengaluru', 'isibang.ac.in'),
 ('Indian Statistical Institute Delhi', 'ISI Delhi', 'New Delhi', 'isid.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- Central & major state universities
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('University of Delhi', 'DU', 'New Delhi', 'du.ac.in'),
 ('Jawaharlal Nehru University', 'JNU', 'New Delhi', 'jnu.ac.in'),
 ('Banaras Hindu University', 'BHU', 'Varanasi', 'bhu.ac.in'),
 ('University of Hyderabad', 'UoH', 'Hyderabad', 'uohyd.ac.in'),
 ('University of Mumbai', 'Mumbai University', 'Mumbai', 'mu.ac.in'),
 ('University of Calcutta', 'Calcutta University', 'Kolkata', 'caluniv.ac.in'),
 ('University of Madras', 'Madras University', 'Chennai', 'unom.ac.in'),
 ('Anna University', 'Anna University', 'Chennai', 'annauniv.edu'),
 ('Aligarh Muslim University', 'AMU', 'Aligarh', 'amu.ac.in'),
 ('Jamia Millia Islamia', 'JMI', 'New Delhi', 'jmi.ac.in'),
 ('Panjab University', 'PU', 'Chandigarh', 'puchd.ac.in'),
 ('Osmania University', 'OU', 'Hyderabad', 'osmania.ac.in'),
 ('Savitribai Phule Pune University', 'SPPU', 'Pune', 'unipune.ac.in'),
 ('University of Rajasthan', 'UOR', 'Jaipur', 'uniraj.ac.in'),
 ('Gujarat University', 'GU', 'Ahmedabad', 'gujaratuniversity.ac.in'),
 ('Andhra University', 'AU', 'Visakhapatnam', 'andhrauniversity.edu.in'),
 ('Bangalore University', 'BU', 'Bengaluru', 'bangaloreuniversity.ac.in'),
 ('University of Kerala', 'Kerala University', 'Thiruvananthapuram', 'keralauniversity.ac.in'),
 ('Cochin University of Science and Technology', 'CUSAT', 'Kochi', 'cusat.ac.in'),
 ('University of Mysore', 'UoM', 'Mysuru', 'uni-mysore.ac.in'),
 ('Visvesvaraya Technological University', 'VTU', 'Belagavi', 'vtu.ac.in'),
 ('Jawaharlal Nehru Technological University Hyderabad', 'JNTUH', 'Hyderabad', 'jntuh.ac.in'),
 ('Jawaharlal Nehru Technological University Kakinada', 'JNTUK', 'Kakinada', 'jntuk.edu.in'),
 ('Maulana Abul Kalam Azad University of Technology', 'MAKAUT', 'Kolkata', 'makautwb.ac.in'),
 ('West Bengal University of Technology', 'WBUT', 'Kolkata', 'wbut.ac.in'),
 ('Guru Gobind Singh Indraprastha University', 'IPU', 'New Delhi', 'ipu.ac.in'),
 ('Ambedkar University Delhi', 'AUD', 'New Delhi', 'aud.ac.in'),
 ('Indira Gandhi National Open University', 'IGNOU', 'New Delhi', 'ignou.ac.in'),
 ('Tata Institute of Social Sciences', 'TISS', 'Mumbai', 'tiss.edu'),
 ('Tata Institute of Fundamental Research', 'TIFR', 'Mumbai', 'tifr.res.in')
ON CONFLICT (domain) DO NOTHING;

-- Engineering / private / other well-known
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('BITS Pilani', 'BITS Pilani', 'Pilani', 'bits-pilani.ac.in'),
 ('BITS Goa', 'BITS Goa', 'Goa', 'goa.bits-pilani.ac.in'),
 ('BITS Hyderabad', 'BITS Hyderabad', 'Hyderabad', 'hyderabad.bits-pilani.ac.in'),
 ('Birla Institute of Technology Mesra', 'BIT Mesra', 'Ranchi', 'bitmesra.ac.in'),
 ('Vellore Institute of Technology', 'VIT', 'Vellore', 'vit.ac.in'),
 ('VIT Chennai', 'VIT Chennai', 'Chennai', 'vitchennai.ac.in'),
 ('VIT Bhopal', 'VIT Bhopal', 'Bhopal', 'vitbhopal.ac.in'),
 ('VIT AP', 'VIT AP', 'Amaravati', 'vitap.ac.in'),
 ('SRM Institute of Science and Technology', 'SRM', 'Chennai', 'srmist.edu.in'),
 ('Manipal Academy of Higher Education', 'Manipal', 'Manipal', 'manipal.edu'),
 ('Amrita Vishwa Vidyapeetham', 'Amrita', 'Coimbatore', 'amrita.edu'),
 ('Thapar Institute of Engineering and Technology', 'Thapar', 'Patiala', 'thapar.edu'),
 ('PES University', 'PES', 'Bengaluru', 'pes.edu'),
 ('RV College of Engineering', 'RVCE', 'Bengaluru', 'rvce.edu.in'),
 ('BMS College of Engineering', 'BMSCE', 'Bengaluru', 'bmsce.ac.in'),
 ('College of Engineering Pune', 'COEP', 'Pune', 'coep.org.in'),
 ('Veermata Jijabai Technological Institute', 'VJTI', 'Mumbai', 'vjti.ac.in'),
 ('College of Engineering Guindy', 'CEG', 'Chennai', 'annauniv.edu'),
 ('PSG College of Technology', 'PSG Tech', 'Coimbatore', 'psgtech.ac.in'),
 ('National Institute of Technology Kurukshetra Alumni', 'NITKKR', 'Kurukshetra', 'nitkkr.ac.in'),
 ('Indian Institute of Management Ahmedabad', 'IIM Ahmedabad', 'Ahmedabad', 'iima.ac.in'),
 ('Indian Institute of Management Bangalore', 'IIM Bangalore', 'Bengaluru', 'iimb.ac.in'),
 ('Indian Institute of Management Calcutta', 'IIM Calcutta', 'Kolkata', 'iimcal.ac.in'),
 ('Indian Institute of Management Lucknow', 'IIM Lucknow', 'Lucknow', 'iiml.ac.in'),
 ('Indian Institute of Management Indore', 'IIM Indore', 'Indore', 'iimidr.ac.in'),
 ('Indian Institute of Management Kozhikode', 'IIM Kozhikode', 'Kozhikode', 'iimk.ac.in'),
 ('XLRI Jamshedpur', 'XLRI', 'Jamshedpur', 'xlri.ac.in'),
 ('Faculty of Management Studies Delhi', 'FMS Delhi', 'New Delhi', 'fms.edu'),
 ('Netaji Subhas University of Technology', 'NSUT', 'New Delhi', 'nsut.ac.in'),
 ('Indraprastha Institute of Information Technology Delhi', 'IIITD', 'New Delhi', 'iiitd.ac.in'),
 ('Jamia Hamdard', 'Jamia Hamdard', 'New Delhi', 'jamiahamdard.ac.in'),
 ('Symbiosis International University', 'SIU', 'Pune', 'siu.edu.in'),
 ('Christ University', 'Christ', 'Bengaluru', 'christuniversity.in'),
 ('Ashoka University', 'Ashoka', 'Sonipat', 'ashoka.edu.in'),
 ('Shiv Nadar University', 'SNU', 'Greater Noida', 'snu.edu.in'),
 ('Kalinga Institute of Industrial Technology', 'KIIT', 'Bhubaneswar', 'kiit.ac.in'),
 ('Siksha O Anusandhan', 'SOA', 'Bhubaneswar', 'soa.ac.in'),
 ('Lovely Professional University', 'LPU', 'Phagwara', 'lpu.co.in'),
 ('Chandigarh University', 'CU', 'Mohali', 'cuchd.in'),
 ('Amity University Noida', 'Amity', 'Noida', 'amity.edu'),
 ('Graphic Era University', 'GEU', 'Dehradun', 'geu.ac.in'),
 ('UPES Dehradun', 'UPES', 'Dehradun', 'ddn.upes.ac.in'),
 ('Nirma University', 'Nirma', 'Ahmedabad', 'nirmauni.ac.in'),
 ('DAIICT Gandhinagar', 'DAIICT', 'Gandhinagar', 'daiict.ac.in'),
 ('LNMIIT Jaipur', 'LNMIIT', 'Jaipur', 'lnmiit.ac.in'),
 ('IIITM Gwalior', 'IIITM', 'Gwalior', 'iiitm.ac.in'),
 ('Harcourt Butler Technical University', 'HBTU', 'Kanpur', 'hbtu.ac.in'),
 ('Jadavpur University', 'JU', 'Kolkata', 'jaduniv.edu.in'),
 ('Presidency University Kolkata', 'Presidency', 'Kolkata', 'presiuniv.ac.in'),
 ('St. Xavier''s College Kolkata', 'St Xaviers Kolkata', 'Kolkata', 'sxccal.edu'),
 ('Loyola College Chennai', 'Loyola', 'Chennai', 'loyolacollege.edu'),
 ('St. Stephen''s College Delhi', 'St Stephens', 'New Delhi', 'ststephens.edu'),
 ('Hindu College Delhi', 'Hindu College', 'New Delhi', 'hinducollege.ac.in'),
 ('Miranda House Delhi', 'Miranda House', 'New Delhi', 'mirandahouse.ac.in'),
 ('Lady Shri Ram College', 'LSR', 'New Delhi', 'lsr.edu.in'),
 ('Sri Venkateswara College Delhi', 'SVC', 'New Delhi', 'svc.ac.in'),
 ('Hansraj College Delhi', 'Hansraj', 'New Delhi', 'hansrajcollege.ac.in'),
 ('Ramjas College Delhi', 'Ramjas', 'New Delhi', 'ramjas.du.ac.in'),
 ('Kirori Mal College Delhi', 'KMC', 'New Delhi', 'kmcollege.ac.in'),
 ('Gargi College Delhi', 'Gargi', 'New Delhi', 'gargicollege.in'),
 ('Shaheed Sukhdev College of Business Studies', 'SSCBS', 'New Delhi', 'sscbsdu.ac.in'),
 ('All India Institute of Medical Sciences Delhi', 'AIIMS Delhi', 'New Delhi', 'aiims.edu'),
 ('Christian Medical College Vellore', 'CMC Vellore', 'Vellore', 'cmcvellore.ac.in'),
 ('Armed Forces Medical College', 'AFMC', 'Pune', 'afmc.nic.in'),
 ('JIPMER Puducherry', 'JIPMER', 'Puducherry', 'jipmer.edu.in'),
 ('King George''s Medical University', 'KGMU', 'Lucknow', 'kgmu.org'),
 ('Maulana Azad Medical College', 'MAMC', 'New Delhi', 'mamc.ac.in'),
 ('Lady Hardinge Medical College', 'LHMC', 'New Delhi', 'lhmc-hosp.gov.in'),
 ('Institute of Chemical Technology Mumbai', 'ICT Mumbai', 'Mumbai', 'ictmumbai.edu.in'),
 ('Institute of Technology Nirma University', 'ITNU', 'Ahmedabad', 'nirmauni.ac.in'),
 ('Sardar Vallabhbhai National Institute of Technology', 'SVNIT', 'Surat', 'svnit.ac.in'),
 ('Visvesvaraya National Institute of Technology', 'VNIT', 'Nagpur', 'vnit.ac.in'),
 ('Motilal Nehru National Institute of Technology', 'MNNIT', 'Prayagraj', 'mnnit.ac.in'),
 ('Malaviya National Institute of Technology', 'MNIT', 'Jaipur', 'mnit.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- Resolve / auto-create college for any Indian academic email domain
CREATE OR REPLACE FUNCTION public.college_for_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d text := lower(split_part(_email, '@', 2));
  found uuid;
  pretty text;
BEGIN
  IF d IS NULL OR d = '' THEN
    RETURN NULL;
  END IF;

  -- Exact or parent-domain match (longest domain wins)
  SELECT c.id INTO found
  FROM public.colleges c
  WHERE d = c.domain OR d LIKE '%.' || c.domain
  ORDER BY length(c.domain) DESC
  LIMIT 1;

  IF found IS NOT NULL THEN
    RETURN found;
  END IF;

  -- Auto-accept official Indian academic TLDs
  IF d LIKE '%.ac.in'
     OR d LIKE '%.edu.in'
     OR d LIKE '%.res.in'
     OR d LIKE '%.ernet.in'
     OR d LIKE '%.nic.in'
  THEN
    pretty := initcap(replace(split_part(d, '.', 1), '-', ' '));

    INSERT INTO public.colleges (name, short_name, city, domain)
    VALUES (
      pretty || ' (auto)',
      upper(split_part(d, '.', 1)),
      NULL,
      d
    )
    ON CONFLICT (domain) DO UPDATE SET domain = EXCLUDED.domain
    RETURNING id INTO found;

    RETURN found;
  END IF;

  RETURN NULL;
END;
$$;

-- Client-callable helper used at signup to show college name
CREATE OR REPLACE FUNCTION public.lookup_college_for_email(_email text)
RETURNS TABLE (id uuid, name text, short_name text, domain text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
BEGIN
  cid := public.college_for_email(_email);
  IF cid IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT c.id, c.name, c.short_name, c.domain
    FROM public.colleges c
    WHERE c.id = cid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.college_for_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_college_for_email(text) TO anon, authenticated;

-- ===== 0003_private_universities =====
-- Major private / deemed universities in India
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('Amity University Noida', 'Amity Noida', 'Noida', 'amity.edu'),
 ('Lovely Professional University', 'LPU', 'Phagwara', 'lpu.co.in'),
 ('Lovely Professional University', 'LPU', 'Phagwara', 'lpu.in'),
 ('Chandigarh University', 'CU', 'Mohali', 'cuchd.in'),
 ('Sharda University', 'Sharda', 'Greater Noida', 'sharda.ac.in'),
 ('Galgotias University', 'Galgotias', 'Greater Noida', 'galgotiasuniversity.edu.in'),
 ('GLA University', 'GLA', 'Mathura', 'gla.ac.in'),
 ('Bennett University', 'Bennett', 'Greater Noida', 'bennett.edu.in'),
 ('Shiv Nadar University', 'SNU', 'Greater Noida', 'snu.edu.in'),
 ('Ashoka University', 'Ashoka', 'Sonipat', 'ashoka.edu.in'),
 ('O.P. Jindal Global University', 'JGU', 'Sonipat', 'jgu.edu.in'),
 ('UPES Dehradun', 'UPES', 'Dehradun', 'upes.ac.in'),
 ('Graphic Era University', 'GEU', 'Dehradun', 'geu.ac.in'),
 ('DIT University', 'DIT', 'Dehradun', 'dituniversity.edu.in'),
 ('Shoolini University', 'Shoolini', 'Solan', 'shooliniuniversity.com'),
 ('Chitkara University', 'Chitkara', 'Rajpura', 'chitkara.edu.in'),
 ('BML Munjal University', 'BMU', 'Gurugram', 'bmu.edu.in'),
 ('Manav Rachna University', 'MRU', 'Faridabad', 'mru.edu.in'),
 ('Parul University', 'Parul', 'Vadodara', 'paruluniversity.ac.in'),
 ('Nirma University', 'Nirma', 'Ahmedabad', 'nirmauni.ac.in'),
 ('Ahmedabad University', 'Ahmedabad Univ', 'Ahmedabad', 'ahduni.edu.in'),
 ('MIT World Peace University', 'MIT-WPU', 'Pune', 'mitwpu.edu.in'),
 ('FLAME University', 'FLAME', 'Pune', 'flame.edu.in'),
 ('NMIMS University', 'NMIMS', 'Mumbai', 'nmims.edu'),
 ('Christ University', 'Christ', 'Bengaluru', 'christuniversity.in'),
 ('Jain University', 'Jain', 'Bengaluru', 'jainuniversity.ac.in'),
 ('REVA University', 'REVA', 'Bengaluru', 'reva.edu.in'),
 ('Alliance University', 'Alliance', 'Bengaluru', 'alliance.edu.in'),
 ('Azim Premji University', 'APU', 'Bengaluru', 'azimpremjiuniversity.edu.in'),
 ('Manipal Academy of Higher Education', 'MAHE', 'Manipal', 'manipal.edu'),
 ('Amrita Vishwa Vidyapeetham', 'Amrita', 'Coimbatore', 'amrita.edu'),
 ('Vellore Institute of Technology', 'VIT', 'Vellore', 'vit.ac.in'),
 ('VIT Student', 'VIT', 'Vellore', 'vitstudent.ac.in'),
 ('SRM Institute of Science and Technology', 'SRMIST', 'Chennai', 'srmist.edu.in'),
 ('Sathyabama Institute', 'Sathyabama', 'Chennai', 'sathyabama.ac.in'),
 ('KL University', 'KL University', 'Vijayawada', 'kluniversity.in'),
 ('GITAM University', 'GITAM', 'Visakhapatnam', 'gitam.edu'),
 ('KIIT University', 'KIIT', 'Bhubaneswar', 'kiit.ac.in'),
 ('SOA University', 'SOA', 'Bhubaneswar', 'soa.ac.in'),
 ('XIM University', 'XIM', 'Bhubaneswar', 'xim.edu.in'),
 ('Krea University', 'Krea', 'Sri City', 'krea.edu.in'),
 ('Mahindra University', 'Mahindra Univ', 'Hyderabad', 'mahindrauniversity.edu.in'),
 ('Woxsen University', 'Woxsen', 'Hyderabad', 'woxsen.edu.in'),
 ('Jaypee Institute of Information Technology', 'JIIT', 'Noida', 'jiit.ac.in'),
 ('Jaypee University of Information Technology', 'JUIT', 'Solan', 'juit.ac.in'),
 ('Integral University', 'Integral', 'Lucknow', 'iul.ac.in'),
 ('Teerthanker Mahaveer University', 'TMU', 'Moradabad', 'tmu.ac.in'),
 ('Sikkim Manipal University', 'SMU', 'Gangtok', 'smu.edu.in'),
 ('Assam Down Town University', 'AdtU', 'Guwahati', 'adtu.in'),
 ('Kaziranga University', 'KU Assam', 'Jorhat', 'kzu.ac.in'),
 ('Adamas University', 'Adamas', 'Kolkata', 'adamasuniversity.ac.in'),
 ('Brainware University', 'Brainware', 'Kolkata', 'brainwareuniversity.ac.in'),
 ('JECRC University', 'JECRC', 'Jaipur', 'jecrcu.edu.in'),
 ('Manipal University Jaipur', 'MUJ', 'Jaipur', 'jaipur.manipal.edu'),
 ('Poornima University', 'Poornima', 'Jaipur', 'poornima.edu.in'),
 ('NIIT University', 'NIIT University', 'Neemrana', 'niituniversity.in'),
 ('GD Goenka University', 'GD Goenka', 'Gurugram', 'gdgoenka.ac.in'),
 ('K.R. Mangalam University', 'KRMU', 'Gurugram', 'krmangalam.edu.in'),
 ('The NorthCap University', 'NCU', 'Gurugram', 'ncuindia.edu'),
 ('Apeejay Stya University', 'Apeejay Stya', 'Gurugram', 'asu.apeejay.edu'),
 ('Thapar Institute of Engineering and Technology', 'Thapar', 'Patiala', 'thapar.edu'),
 ('BITS Pilani', 'BITS Pilani', 'Pilani', 'bits-pilani.ac.in'),
 ('Symbiosis International University', 'SIU', 'Pune', 'siu.edu.in'),
 ('PES University', 'PES', 'Bengaluru', 'pes.edu'),
 ('Dayananda Sagar University', 'DSU', 'Bengaluru', 'dsu.edu.in'),
 ('CMR University', 'CMR', 'Bengaluru', 'cmr.edu.in'),
 ('Presidency University Bangalore', 'Presidency BLR', 'Bengaluru', 'presidencyuniversity.in'),
 ('Hindustan Institute of Technology and Science', 'HITS', 'Chennai', 'hindustanuniv.ac.in'),
 ('Karunya Institute of Technology', 'Karunya', 'Coimbatore', 'karunya.edu'),
 ('Kalasalingam Academy', 'KARE', 'Krishnankoil', 'klu.ac.in'),
 ('SRM University AP', 'SRM AP', 'Amaravati', 'srmap.edu.in'),
 ('VIT AP University', 'VIT AP', 'Amaravati', 'vitap.ac.in'),
 ('VIT Bhopal', 'VIT Bhopal', 'Bhopal', 'vitbhopal.ac.in'),
 ('Centurion University', 'CUTM', 'Paralakhemundi', 'cutm.ac.in'),
 ('Birla Global University', 'BGU', 'Bhubaneswar', 'bgu.ac.in'),
 ('Arka Jain University', 'Arka Jain', 'Jamshedpur', 'arkajainuniversity.ac.in'),
 ('Jagran Lakecity University', 'JLU', 'Bhopal', 'jlu.edu.in'),
 ('LNCT University', 'LNCTU', 'Bhopal', 'lnctu.ac.in'),
 ('MATS University', 'MATS', 'Raipur', 'matsuniversity.ac.in'),
 ('Kalinga University', 'Kalinga Raipur', 'Raipur', 'kalingauniversity.ac.in'),
 ('ICFAI Foundation for Higher Education', 'IFHE', 'Hyderabad', 'ifheindia.org'),
 ('Anurag University', 'Anurag', 'Hyderabad', 'anurag.edu.in'),
 ('Malla Reddy University', 'MRU Hyd', 'Hyderabad', 'mallareddyuniversity.ac.in'),
 ('Noida International University', 'NIU', 'Greater Noida', 'niu.edu.in'),
 ('Invertis University', 'Invertis', 'Bareilly', 'invertisuniversity.ac.in'),
 ('Babu Banarasi Das University', 'BBDU', 'Lucknow', 'bbdu.ac.in'),
 ('Shobhit University', 'Shobhit', 'Meerut', 'shobhituniversity.ac.in'),
 ('Rama University', 'Rama', 'Kanpur', 'ramauniversity.ac.in'),
 ('IFTM University', 'IFTM', 'Moradabad', 'iftmuniversity.ac.in'),
 ('Uttaranchal University', 'UU', 'Dehradun', 'uttaranchaluniversity.ac.in'),
 ('Graphic Era Hill University', 'GEHU', 'Dehradun', 'gehu.ac.in'),
 ('Swami Rama Himalayan University', 'SRHU', 'Dehradun', 'srhu.edu.in'),
 ('Rayat Bahra University', 'Rayat Bahra', 'Mohali', 'rayatbahrauniversity.edu.in'),
 ('CT University', 'CTU', 'Ludhiana', 'ctuniversity.in'),
 ('Desh Bhagat University', 'DBU', 'Mandi Gobindgarh', 'deshbhagatuniversity.in'),
 ('RIMT University', 'RIMT', 'Mandi Gobindgarh', 'rimt.ac.in'),
 ('Ganpat University', 'Ganpat', 'Mehsana', 'ganpatuniversity.ac.in'),
 ('Charusat University', 'CHARUSAT', 'Changa', 'charusat.ac.in'),
 ('Marwadi University', 'Marwadi', 'Rajkot', 'marwadieducation.edu.in'),
 ('RK University', 'RKU', 'Rajkot', 'rku.ac.in'),
 ('Indus University', 'Indus', 'Ahmedabad', 'indusuni.ac.in'),
 ('Pandit Deendayal Energy University', 'PDEU', 'Gandhinagar', 'pdpu.ac.in'),
 ('Somaiya Vidyavihar University', 'Somaiya', 'Mumbai', 'somaiya.edu'),
 ('Dr. D.Y. Patil Vidyapeeth', 'DPU', 'Pune', 'dpu.edu.in'),
 ('Ajeenkya DY Patil University', 'ADYPU', 'Pune', 'adypu.edu.in'),
 ('Vishwakarma University', 'VU Pune', 'Pune', 'vupune.ac.in'),
 ('Sandip University', 'Sandip', 'Nashik', 'sandipuniversity.edu.in'),
 ('Bharati Vidyapeeth', 'BVDU', 'Pune', 'bharatividyapeeth.edu'),
 ('Yenepoya University', 'Yenepoya', 'Mangaluru', 'yenepoya.edu.in'),
 ('Nitte University', 'Nitte', 'Mangaluru', 'nitte.edu.in'),
 ('KLE Technological University', 'KLE Tech', 'Hubballi', 'kletech.ac.in'),
 ('JSS Academy of Higher Education', 'JSS AHER', 'Mysuru', 'jssuni.edu.in'),
 ('Srinivas University', 'Srinivas', 'Mangaluru', 'srinivasuniversity.edu.in'),
 ('Saveetha Institute', 'SIMATS', 'Chennai', 'saveetha.com'),
 ('Vel Tech University', 'Vel Tech', 'Chennai', 'veltech.edu.in'),
 ('Dr. M.G.R. Educational and Research Institute', 'Dr MGR', 'Chennai', 'drmgrdu.ac.in'),
 ('Bharath Institute of Higher Education', 'BIHER', 'Chennai', 'bharathuniv.ac.in'),
 ('Sri Ramachandra Institute', 'SRIHER', 'Chennai', 'sriramachandra.edu.in'),
 ('Vignan University', 'VFSTR', 'Guntur', 'vignan.ac.in'),
 ('ICFAI University Dehradun', 'ICFAI DDN', 'Dehradun', 'iudehradun.edu.in'),
 ('ICFAI University Jaipur', 'ICFAI Jaipur', 'Jaipur', 'iujaipur.edu.in'),
 ('ICFAI University Jharkhand', 'ICFAI JKD', 'Ranchi', 'iujharkhand.edu.in'),
 ('ICFAI University Tripura', 'ICFAI Tripura', 'Agartala', 'iutripura.edu.in'),
 ('ICFAI University Sikkim', 'ICFAI Sikkim', 'Gangtok', 'iusikkim.edu.in'),
 ('Assam Don Bosco University', 'ADBU', 'Guwahati', 'dbuniversity.ac.in'),
 ('University of Science and Technology Meghalaya', 'USTM', 'Ri-Bhoi', 'ustm.ac.in'),
 ('Martin Luther Christian University', 'MLCU', 'Shillong', 'mlcuniv.in'),
 ('JIS University', 'JIS', 'Kolkata', 'jisuniversity.ac.in'),
 ('Techno India University', 'TIU', 'Kolkata', 'technoindiauniversity.ac.in'),
 ('St. Xavier''s University Kolkata', 'SXUK', 'Kolkata', 'sxuk.edu.in'),
 ('Medi-Caps University', 'Medi-Caps', 'Indore', 'medicaps.ac.in'),
 ('SAGE University', 'SAGE', 'Indore', 'sageuniversity.in'),
 ('Oriental University', 'Oriental', 'Indore', 'orientaluniversity.in'),
 ('RKDF University', 'RKDF', 'Bhopal', 'rkdf.ac.in'),
 ('Rabindranath Tagore University', 'RNTU', 'Bhopal', 'rntu.ac.in'),
 ('ITM University Gwalior', 'ITM Gwalior', 'Gwalior', 'itmuniversity.ac.in'),
 ('Amity University Gwalior', 'Amity Gwalior', 'Gwalior', 'gwa.amity.edu'),
 ('Amity University Mumbai', 'Amity Mumbai', 'Mumbai', 'mum.amity.edu'),
 ('Amity University Jaipur', 'Amity Jaipur', 'Jaipur', 'jpr.amity.edu'),
 ('Amity University Haryana', 'Amity Haryana', 'Gurugram', 'ggn.amity.edu'),
 ('Amity University Kolkata', 'Amity Kolkata', 'Kolkata', 'kol.amity.edu'),
 ('Amity University Ranchi', 'Amity Ranchi', 'Ranchi', 'rnc.amity.edu'),
 ('Amity University Raipur', 'Amity Raipur', 'Raipur', 'rpr.amity.edu'),
 ('Amity University Lucknow', 'Amity Lucknow', 'Lucknow', 'lko.amity.edu')
ON CONFLICT (domain) DO NOTHING;
