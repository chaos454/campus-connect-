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