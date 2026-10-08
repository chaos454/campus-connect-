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