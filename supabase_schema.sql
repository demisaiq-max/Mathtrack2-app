-- ENUMS
create type public.user_role as enum ('admin','student');
create type public.difficulty_level as enum ('Easy','Medium','Hard');
create type public.question_type as enum ('MCQ','TRUE_FALSE','SHORT_ANSWER','ESSAY','PROOF');
create type public.announcement_priority as enum ('normal','high','urgent');
create type public.submission_status as enum ('Pending','Graded','Reviewed');
create type public.schedule_type as enum ('Class','Exam','Meeting','Other');

-- CORE: PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role user_role not null,
  grade_level int check (grade_level between 5 and 12) null,
  profile_image text null,
  created_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
create index profiles_grade_idx on public.profiles(grade_level);

-- SUBJECTS (per admin ownership; reusable by grade)
create table public.subjects (
  id bigserial primary key,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique(admin_id, name)
);
create index subjects_admin_idx on public.subjects(admin_id);

-- EXAMS
create table public.exams (
  id bigserial primary key,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  subject_id bigint not null references public.subjects(id) on delete restrict,
  grade_level int not null check (grade_level between 5 and 12),
  duration_minutes int not null default 60 check (duration_minutes > 0),
  instructions text,
  allowed_attempts int not null default 1 check (allowed_attempts >= 1),
  passing_score numeric(5,2) not null default 60.00 check (passing_score between 0 and 100),
  shuffle_questions boolean not null default false,
  show_results boolean not null default true,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);
create index exams_admin_idx on public.exams(admin_id);
create index exams_grade_idx on public.exams(grade_level);
create index exams_subject_idx on public.exams(subject_id);
create index exams_sched_idx on public.exams(scheduled_start, scheduled_end);

-- QUESTIONS
create table public.exam_questions (
  id bigserial primary key,
  exam_id bigint not null references public.exams(id) on delete cascade,
  position int not null default 1,
  type question_type not null,
  difficulty difficulty_level,
  points numeric(6,2) not null default 1.0 check (points >= 0),
  prompt text not null,
  options jsonb, -- e.g., [{"key":"A","text":"..."}, ...] or [{"key":"T","text":"True"},{"key":"F","text":"False"}]
  correct_answer text, -- e.g., "B" or "True"
  explanation text,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);
create index exam_questions_exam_idx on public.exam_questions(exam_id);

-- SUBMISSIONS (answer sheets / online submissions)
create table public.exam_submissions (
  id bigserial primary key,
  exam_id bigint not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number int not null default 1,
  submitted_at timestamptz,
  status submission_status not null default 'Pending',
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  score_percent numeric(5,2) check (score_percent between 0 and 100),
  total_points numeric(8,2),
  earned_points numeric(8,2),
  file_name text,
  file_size_bytes bigint,
  storage_path text,
  unique (exam_id, student_id, attempt_number)
);
create index exam_submissions_exam_idx on public.exam_submissions(exam_id);
create index exam_submissions_student_idx on public.exam_submissions(student_id);
create index exam_submissions_status_idx on public.exam_submissions(status);
create index exam_submissions_dates_idx on public.exam_submissions(submitted_at);

-- SUBMISSION ANSWERS (per question)
create table public.submission_answers (
  id bigserial primary key,
  submission_id bigint not null references public.exam_submissions(id) on delete cascade,
  question_id bigint not null references public.exam_questions(id) on delete cascade,
  answer_text text,
  selected_key text,
  is_correct boolean,
  earned_points numeric(6,2),
  auto_graded boolean not null default false,
  feedback text,
  created_at timestamptz not null default now(),
  unique (submission_id, question_id)
);
create index submission_answers_sub_idx on public.submission_answers(submission_id);

-- AGGREGATED SCORES (for dashboards)
create table public.student_exam_stats (
  id bigserial primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject_id bigint not null references public.subjects(id) on delete cascade,
  exams_taken int not null default 0,
  highest_score numeric(5,2),
  lowest_score numeric(5,2),
  average_score numeric(5,2),
  last_exam_date date,
  updated_at timestamptz not null default now(),
  unique(student_id, subject_id)
);
create index student_exam_stats_student_idx on public.student_exam_stats(student_id);

-- ANNOUNCEMENTS (Board)
create table public.announcements (
  id bigserial primary key,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  grade_level int not null check (grade_level between 5 and 12),
  title text not null,
  priority announcement_priority not null default 'normal',
  body text not null,
  created_at timestamptz not null default now()
);
create index announcements_grade_idx on public.announcements(grade_level);
create index announcements_admin_idx on public.announcements(admin_id);

-- ANNOUNCEMENT LIKES
create table public.announcement_likes (
  id bigserial primary key,
  announcement_id bigint not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(announcement_id, user_id)
);

-- ANNOUNCEMENT COMMENTS
create table public.announcement_comments (
  id bigserial primary key,
  announcement_id bigint not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);
create index announcement_comments_idx on public.announcement_comments(announcement_id);

-- Q&A (Ask Question forum, visible within the same grade)
create table public.questions (
  id bigserial primary key,
  grade_level int not null check (grade_level between 5 and 12),
  subject_id bigint references public.subjects(id) on delete set null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index questions_grade_idx on public.questions(grade_level);
create index questions_subject_idx on public.questions(subject_id);

create table public.question_likes (
  id bigserial primary key,
  question_id bigint not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(question_id, user_id)
);

create table public.question_comments (
  id bigserial primary key,
  question_id bigint not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);
create index question_comments_idx on public.question_comments(question_id);

-- SCHEDULE (Admin schedule items: Exam/Class/Meeting)
create table public.schedules (
  id bigserial primary key,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type schedule_type not null default 'Exam',
  subject_id bigint references public.subjects(id) on delete set null,
  grade_level int check (grade_level between 5 and 12),
  date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  created_at timestamptz not null default now()
);
create index schedules_admin_idx on public.schedules(admin_id);
create index schedules_grade_idx on public.schedules(grade_level);

-- ACHIEVEMENTS
create table public.achievement_definitions (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  description text not null,
  target_value numeric(10,2),
  subject_id bigint references public.subjects(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.student_achievements (
  id bigserial primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id bigint not null references public.achievement_definitions(id) on delete cascade,
  earned boolean not null default false,
  progress_value numeric(10,2) not null default 0,
  earned_at timestamptz,
  created_at timestamptz not null default now(),
  unique(student_id, achievement_id)
);
create index student_achievements_student_idx on public.student_achievements(student_id);

-- DASHBOARD METRICS SNAPSHOTS (optional for performance overview)
create table public.metrics_daily (
  id bigserial primary key,
  snapshot_date date not null unique,
  total_students int not null,
  active_exams int not null,
  avg_score numeric(5,2),
  pending_reviews int not null,
  created_at timestamptz not null default now()
);

-- UTILITY: VIEWS for student home/scores pages
-- FIXED THE ERROR IN THIS VIEW
create or replace view public.v_student_latest_scores as
select
  es.student_id,
  max(es.submitted_at) as last_submission,
  avg(es.score_percent) as overall_average
from public.exam_submissions as es
group by es.student_id;

-- Enable Row Level Security (RLS) for all tables
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.student_exam_stats enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_likes enable row level security;
alter table public.announcement_comments enable row level security;
alter table public.questions enable row level security;
alter table public.question_likes enable row level security;
alter table public.question_comments enable row level security;
alter table public.schedules enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.student_achievements enable row level security;
alter table public.metrics_daily enable row level security;

-- PROFILES RLS
create policy "profiles_self_read_admin_read_all" on public.profiles
  for select using (id = auth.uid() or (select role from public.profiles where id = auth.uid()) = 'admin');
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- SUBJECTS RLS: admins can manage their own; students read those for their grade via exams
create policy "subjects_admin_manage" on public.subjects
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());
create policy "subjects_students_read_via_exams" on public.subjects
  for select using (
    exists (
      select 1 from public.exams e
      join public.profiles sp on sp.id = auth.uid()
      where e.subject_id = subjects.id and e.grade_level = sp.grade_level
    )
  );

-- EXAMS RLS
create policy "exams_admin_manage_own" on public.exams
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());
create policy "exams_students_read_grade" on public.exams
  for select using (
    exists (select 1 from public.profiles sp where sp.id = auth.uid() and sp.role = 'student' and sp.grade_level = exams.grade_level)
  );

-- EXAM QUESTIONS RLS
create policy "questions_admin_manage_via_exam" on public.exam_questions
  for all using (
    exists (select 1 from public.exams e where e.id = exam_questions.exam_id and e.admin_id = auth.uid())
  ) with check (
    exists (select 1 from public.exams e where e.id = exam_questions.exam_id and e.admin_id = auth.uid())
  );
create policy "questions_students_read_grade" on public.exam_questions
  for select using (
    exists (
      select 1
      from public.exams e
      join public.profiles sp on sp.id = auth.uid()
      where e.id = exam_questions.exam_id
        and sp.role = 'student'
        and sp.grade_level = e.grade_level
    )
  );

-- SUBMISSIONS RLS
create policy "submissions_student_manage_own" on public.exam_submissions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "submissions_admin_read_own_exam" on public.exam_submissions
  for select using (
    exists (
      select 1 from public.exams e
      where e.id = exam_submissions.exam_id and e.admin_id = auth.uid()
    )
  );

-- SUBMISSION ANSWERS RLS
create policy "answers_student_manage_own" on public.submission_answers
  for all using (
    exists (select 1 from public.exam_submissions s where s.id = submission_answers.submission_id and s.student_id = auth.uid())
  ) with check (
    exists (select 1 from public.exam_submissions s where s.id = submission_answers.submission_id and s.student_id = auth.uid() and s.status = 'Pending')
  );
create policy "answers_admin_read_via_exam" on public.submission_answers
  for select using (
    exists (
      select 1 from public.exam_submissions s
      join public.exams e on e.id = s.exam_id
      where s.id = submission_answers.submission_id and e.admin_id = auth.uid()
    )
  );

-- STUDENT EXAM STATS RLS
create policy "stats_student_read_own" on public.student_exam_stats
  for select using (student_id = auth.uid());
create policy "stats_admin_read_all" on public.student_exam_stats
  for select using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ANNOUNCEMENTS & INTERACTIONS RLS
create policy "announcements_admin_manage" on public.announcements
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());
create policy "announcements_students_read_grade" on public.announcements
  for select using (
    exists (select 1 from public.profiles sp where sp.id = auth.uid() and sp.grade_level = announcements.grade_level)
  );
create policy "announcement_interact_read_grade" on public.announcement_likes
  for select using (
    exists (
      select 1 from public.announcements a
      join public.profiles p on p.id = auth.uid()
      where a.id = announcement_likes.announcement_id and a.grade_level = p.grade_level
    )
  );
create policy "announcement_interact_insert_self" on public.announcement_likes
  for insert with check (user_id = auth.uid());
create policy "announcement_interact_read_grade_comments" on public.announcement_comments
  for select using (
    exists (
      select 1 from public.announcements a
      join public.profiles p on p.id = auth.uid()
      where a.id = announcement_comments.announcement_id and a.grade_level = p.grade_level
    )
  );
create policy "announcement_interact_insert_self_comments" on public.announcement_comments
  for insert with check (user_id = auth.uid());

-- QUESTIONS (FORUM) & INTERACTIONS RLS
-- Allow students to insert questions for their own grade
create policy "forum_question_insert_own_grade" on public.questions
  for insert with check (
    author_id = auth.uid() and
    exists (
      select 1 from public.profiles sp 
      where sp.id = auth.uid() and sp.grade_level = questions.grade_level
    )
  );
-- Allow reading questions from same grade
create policy "forum_question_read_same_grade" on public.questions
  for select using (
    exists (
      select 1 from public.profiles sp where sp.id = auth.uid() and sp.grade_level = questions.grade_level
    )
  );
-- Allow authors to update/delete their own questions
create policy "forum_question_manage_own" on public.questions
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy "forum_question_delete_own" on public.questions
  for delete using (author_id = auth.uid());
-- Allow admins to manage all questions
create policy "forum_question_admin_manage" on public.questions
  for all using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "forum_interact_read_grade" on public.question_likes
  for select using (
    exists (
      select 1 from public.questions q
      join public.profiles p on p.id = auth.uid()
      where q.id = question_likes.question_id and q.grade_level = p.grade_level
    )
  );
create policy "forum_interact_insert_self" on public.question_likes
  for insert with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.questions q
      join public.profiles p on p.id = auth.uid()
      where q.id = question_likes.question_id and q.grade_level = p.grade_level
    )
  );
create policy "forum_interact_delete_self" on public.question_likes
  for delete using (user_id = auth.uid());
create policy "forum_interact_read_grade_comments" on public.question_comments
  for select using (
    exists (
      select 1 from public.questions q
      join public.profiles p on p.id = auth.uid()
      where q.id = question_comments.question_id and q.grade_level = p.grade_level
    )
  );
create policy "forum_interact_insert_self_comments" on public.question_comments
  for insert with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.questions q
      join public.profiles p on p.id = auth.uid()
      where q.id = question_comments.question_id and q.grade_level = p.grade_level
    )
  );

-- SCHEDULES RLS
create policy "schedules_admin_manage_own" on public.schedules
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());
create policy "schedules_students_read_grade" on public.schedules
  for select using (
    exists (select 1 from public.profiles sp where sp.id = auth.uid() and sp.grade_level = schedules.grade_level)
  );

-- ACHIEVEMENTS RLS
create policy "achievement_defs_admin_manage" on public.achievement_definitions
  for all using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "achievement_defs_read_all" on public.achievement_definitions
  for select using (true);
create policy "student_achievements_student_manage_own" on public.student_achievements
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "student_achievements_admin_read" on public.student_achievements
  for select using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- METRICS RLS
create policy "metrics_read_all" on public.metrics_daily for select using (true);
create policy "metrics_admin_write" on public.metrics_daily
  for all using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- TRIGGERS
create or replace function public.auto_grade_mcq_tf() returns trigger as $$
declare
  q record;
begin
  select * into q from public.exam_questions where id = new.question_id;
  if q.type in ('MCQ','TRUE_FALSE') and new.selected_key is not null and q.correct_answer is not null then
    new.is_correct := (lower(trim(new.selected_key)) = lower(trim(q.correct_answer)));
    if new.is_correct then
      new.earned_points := coalesce(q.points,1);
    else
      new.earned_points := 0;
    end if;
    new.auto_graded := true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_auto_grade_mcq_tf on public.submission_answers;
create trigger trg_auto_grade_mcq_tf
  before insert or update of selected_key on public.submission_answers
  for each row execute function public.auto_grade_mcq_tf();

create or replace function public.update_submission_totals() returns trigger as $$
declare
  submission_id_to_update bigint;
  totals record;
  exam_totals record;
begin
  if TG_OP = 'DELETE' then
    submission_id_to_update := old.submission_id;
  else
    submission_id_to_update := new.submission_id;
  end if;

  select
    sum(coalesce(sa.earned_points,0)) as earned,
    count(*) as answered
  into totals
  from public.submission_answers sa
  where sa.submission_id = submission_id_to_update;

  select sum(points) as total_points
  into exam_totals
  from public.exam_questions q
  join public.exam_submissions s on s.id = submission_id_to_update
  where q.exam_id = s.exam_id;

  update public.exam_submissions set
    earned_points = totals.earned,
    total_points = nullif(exam_totals.total_points,0),
    score_percent = case
      when nullif(exam_totals.total_points,0) is null then null
      else round((totals.earned / exam_totals.total_points) * 100.0, 2)
    end
  where id = submission_id_to_update;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_update_submission_totals on public.submission_answers;
create trigger trg_update_submission_totals
  after insert or update or delete on public.submission_answers
  for each row execute function public.update_submission_totals();

-- SAMPLE ACHIEVEMENT DEFINITIONS
insert into public.achievement_definitions (code, name, description, target_value) values
  ('FIRST_EXAM','First Steps','Complete your first exam',1),
  ('PERFECT_SCORE','Perfect Score','Score 100% on any exam',100),
  ('CONSISTENT_PERFORMER','Consistent Performer','Score above 80% on 5 consecutive exams',5),
  ('IMPROVEMENT_CHAMPION','Improvement Champion','Improve your average score by 15%',15),
  ('SPEED_DEMON','Speed Demon','Complete an exam in under 30 minutes',30)
on conflict (code) do nothing;