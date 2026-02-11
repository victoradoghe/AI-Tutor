-- 1. Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  first_name text,
  last_name text,
  name text,
  avatar text,
  level integer default 1,
  xp integer default 0,
  streak integer default 1,
  last_active_date text,
  learning_style text,
  interests text[] default '{}', 
  theme text default 'light',
  lessons_completed integer default 0,
  quiz_total_questions integer default 0,
  quiz_total_correct integer default 0,
  subscription_tier text default 'free',
  subscription_status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Allow public read access (or restrict to authenticated users if preferred)
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

-- Allow users to insert their own profile (useful if trigger fails or for manual creation)
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- 3. Create a Trigger to auto-create profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    name, 
    subscription_tier,
    subscription_status,
    xp,
    streak,
    level
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'full_name',
    'free',
    'active',
    0,
    1,
    1
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Flashcards System Tables

-- Folders
create table if not exists public.folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Flashcard Sets
create table if not exists public.flashcard_sets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  folder_id uuid references public.folders on delete set null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Flashcards
create table if not exists public.flashcards (
  id uuid default gen_random_uuid() primary key,
  set_id uuid references public.flashcard_sets on delete cascade not null,
  front text not null,
  back text not null,
  mastered boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.folders enable row level security;
alter table public.flashcard_sets enable row level security;
alter table public.flashcards enable row level security;

-- Folders Policies
create policy "Users can view own folders" on public.folders
  for select using (auth.uid() = user_id);

create policy "Users can insert own folders" on public.folders
  for insert with check (auth.uid() = user_id);

create policy "Users can update own folders" on public.folders
  for update using (auth.uid() = user_id);

create policy "Users can delete own folders" on public.folders
  for delete using (auth.uid() = user_id);

-- Sets Policies
create policy "Users can view own sets" on public.flashcard_sets
  for select using (auth.uid() = user_id);

create policy "Users can insert own sets" on public.flashcard_sets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sets" on public.flashcard_sets
  for update using (auth.uid() = user_id);

create policy "Users can delete own sets" on public.flashcard_sets
  for delete using (auth.uid() = user_id);

-- Flashcards Policies
create policy "Users can view own flashcards" on public.flashcards
  for select using (
    exists (
      select 1 from public.flashcard_sets
      where public.flashcard_sets.id = public.flashcards.set_id
      and public.flashcard_sets.user_id = auth.uid()
    )
  );

create policy "Users can insert own flashcards" on public.flashcards
  for insert with check (
    exists (
      select 1 from public.flashcard_sets
      where public.flashcard_sets.id = set_id
      and public.flashcard_sets.user_id = auth.uid()
    )
  );

create policy "Users can update own flashcards" on public.flashcards
  for update using (
    exists (
      select 1 from public.flashcard_sets
      where public.flashcard_sets.id = public.flashcards.set_id
      and public.flashcard_sets.user_id = auth.uid()
    )
  );

create policy "Users can delete own flashcards" on public.flashcards
  for delete using (
    exists (
      select 1 from public.flashcard_sets
      where public.flashcard_sets.id = public.flashcards.set_id
      and public.flashcard_sets.user_id = auth.uid()
    )
  ); 
-- Let's strictly follow the plan but adding user_id is better practice for Supabase RLS.
-- I will append the column and policy here for simplicity.

-- Re-create flashcards with user_id for easier RLS
-- (Since this is a new table, I can just define it correctly first, but I'll add the alter here to be safe if I was appending)
-- Actually, let's just use the `using` clause with a subquery for correct relational RLS without denormalizing if possible, 
-- BUT Supabase RLS with joins can be tricky.
-- EASIEST: All tables have user_id.
-- I will modify the flashcards creation block above effectively by replacing it in my mind, but since I am appending to file, I will act as if I am writing the block new.

-- Wait, I can't "replace" in my mind. The `write_to_file` overwrites or creates. 
-- I should append these changes to the existing file. 
-- The user has `supabase_schema.sql` open. I should check its content again to see where to append or if I should use `replace_file_content`.
-- I already read it in step 30. It ends at line 76.
-- I will use `run_command` to append to the file or just use `replace_file_content` to add to the end?
-- `replace_file_content` is for replacing. 
-- `write_to_file` with Overwrite=false would fail if file exists? No, tool desc says "By default this tool will error if TargetFile already exists. To overwrite... set Overwrite to true."
-- It doesn't support append.
-- I should use `replace_file_content` to append to the end of the file.

-- 5. Chat History Tables

-- Chat Sessions
create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.chat_sessions on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  text text not null,
  is_audio boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_timestamp bigint -- store the original client-side JS timestamp if needed
);

-- RLS
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;

-- Chat Sessions Policies
create policy "Users can view own chat sessions" on public.chat_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own chat sessions" on public.chat_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own chat sessions" on public.chat_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete own chat sessions" on public.chat_sessions
  for delete using (auth.uid() = user_id);

-- Messages Policies
-- We can check ownership via the session relationship, but strictly adding a session_id policy 
-- requires a join which Supabase RLS supports but is slightly more complex. 
-- Simple way: Allow if you own the session.
create policy "Users can view messages of own sessions" on public.messages
  for select using (
    exists (
      select 1 from public.chat_sessions
      where public.chat_sessions.id = public.messages.session_id
      and public.chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to own sessions" on public.messages
  for insert with check (
    exists (
      select 1 from public.chat_sessions
      where public.chat_sessions.id = session_id
      and public.chat_sessions.user_id = auth.uid()
    )
  );

-- Assuming we don't update individual messages often, but if we do:
create policy "Users can update messages of own sessions" on public.messages
  for update using (
    exists (
      select 1 from public.chat_sessions
      where public.chat_sessions.id = public.messages.session_id
      and public.chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete messages of own sessions" on public.messages
  for delete using (
    exists (
      select 1 from public.chat_sessions
      where public.chat_sessions.id = public.messages.session_id
      and public.chat_sessions.user_id = auth.uid()
    )
  );

-- 5. Chat History Tables

create table if not exists public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.chat_sessions on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  text text not null,
  is_audio boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  timestamp bigint -- Legacy timestamp field for frontend compatibility if needed, or we can use created_at
);

-- RLS Policies for Chat
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;

-- Sessions Policies
create policy "Users can view own chat sessions" on public.chat_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own chat sessions" on public.chat_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own chat sessions" on public.chat_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete own chat sessions" on public.chat_sessions
  for delete using (auth.uid() = user_id);

-- Messages Policies
-- Users can access messages if they own the session
create policy "Users can view own messages" on public.messages
  for select using (
    exists (
      select 1 from public.chat_sessions
      where public.chat_sessions.id = public.messages.session_id
      and public.chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own messages" on public.messages
  for insert with check (
    exists (
      select 1 from public.chat_sessions
      where public.chat_sessions.id = session_id
      and public.chat_sessions.user_id = auth.uid()
    )
  );
