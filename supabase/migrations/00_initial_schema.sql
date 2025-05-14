

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'coach',
    'athlete'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_missing_profile"("user_id" "uuid", "role" "text" DEFAULT 'coach'::"text", "full_name" "text" DEFAULT 'User'::"text", "email" "text" DEFAULT NULL::"text", "avatar_url" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  email_value TEXT;
BEGIN
  -- Make sure we have a valid email
  SELECT COALESCE(email, au.email) INTO email_value
  FROM auth.users au
  WHERE au.id = user_id;
  
  -- Insert the profile if it doesn't exist
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    email,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    role,
    full_name,
    email_value,
    avatar_url,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error adding missing profile: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."add_missing_profile"("user_id" "uuid", "role" "text", "full_name" "text", "email" "text", "avatar_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_athlete_role_for_team_members"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the user is a coach trying to become an athlete team member
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.athlete_id AND role = 'coach'
  ) THEN
    RAISE EXCEPTION 'A coach (%) cannot be added as an athlete to a team', NEW.athlete_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_athlete_role_for_team_members"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_coach_role_for_teams"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the user is an athlete trying to create a team
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.coach_id AND role = 'athlete'
  ) THEN
    RAISE EXCEPTION 'An athlete (%) cannot create or manage a team', NEW.coach_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_coach_role_for_teams"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_consistent_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If this is a new record, allow it
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- If the role is changing from athlete to coach or vice versa, prevent it
  IF (OLD.role = 'athlete' AND NEW.role = 'coach') OR 
     (OLD.role = 'coach' AND NEW.role = 'athlete') THEN
    RAISE EXCEPTION 'Role change from % to % is not allowed. Users cannot switch between athlete and coach roles.', 
      OLD.role, NEW.role;
  END IF;
  
  -- Otherwise allow the update
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_consistent_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  role_value TEXT;
  full_name_value TEXT;
  email_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- Get role from metadata or default to athlete
  role_value := COALESCE(
    NEW.raw_user_meta_data->>'role',
    current_setting('request.jwt.claim.role', true),
    'athlete'
  );
  
  -- Get name from metadata fields
  full_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'User'
  );
  
  -- Get email from auth info or metadata
  email_value := COALESCE(
    NEW.email,
    NEW.raw_user_meta_data->>'email',
    ''
  );
  
  -- Get avatar from metadata
  avatar_url_value := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );
  
  -- Log the values for debugging
  RAISE LOG 'Creating profile for user % with role %, name %, email %',
    NEW.id, role_value, full_name_value, email_value;
  
  -- Insert profile with validation
  BEGIN
    INSERT INTO public.profiles (
      id, 
      role,
      full_name, 
      email,
      avatar_url
    ) VALUES (
      NEW.id,
      role_value,
      full_name_value,
      email_value,
      avatar_url_value
    );
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Profile already exists for user %', NEW.id;
    WHEN check_violation THEN
      RAISE LOG 'Invalid data for profile: %', NEW.raw_user_meta_data;
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_coach_athletes_status_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set previous_status to the old status value before update
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.previous_status = OLD.status;
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_coach_athletes_status_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_athlete_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.athlete_id AND role = 'athlete'
  ) THEN
    RAISE EXCEPTION 'Only users with athlete role can be added to teams';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_athlete_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_coach_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.coach_id AND role = 'coach'
  ) THEN
    RAISE EXCEPTION 'Only users with coach role can create or update teams';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_coach_role"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."coach_athletes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "athlete_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "previous_status" "text",
    CONSTRAINT "coach_athletes_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'declined'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."coach_athletes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'athlete'::"text" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_email" CHECK (("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "athlete_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "athlete_id_not_null" CHECK (("athlete_id" IS NOT NULL))
);


ALTER TABLE "public"."program_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "duration_weeks" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "start_date" "date" DEFAULT ("now"())::"date" NOT NULL,
    "end_date" "date" DEFAULT (("now"() + '7 days'::interval))::"date" NOT NULL,
    CONSTRAINT "programs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "session_date" "date" NOT NULL
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sessions"."session_date" IS 'The date when this session is scheduled';



CREATE TABLE IF NOT EXISTS "public"."workouts" (
    "workout_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "description" "text",
    "color" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workouts" OWNER TO "postgres";


COMMENT ON TABLE "public"."workouts" IS 'Stores workout information associated with training sessions';



ALTER TABLE ONLY "public"."coach_athletes"
    ADD CONSTRAINT "coach_athletes_coach_id_athlete_id_key" UNIQUE ("coach_id", "athlete_id");



ALTER TABLE ONLY "public"."coach_athletes"
    ADD CONSTRAINT "coach_athletes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_assignments"
    ADD CONSTRAINT "program_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_pkey" PRIMARY KEY ("workout_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_programs_coach" ON "public"."programs" USING "btree" ("coach_id");



CREATE INDEX "idx_sessions_date" ON "public"."sessions" USING "btree" ("session_date");



CREATE INDEX "idx_sessions_program_id" ON "public"."sessions" USING "btree" ("program_id");



CREATE INDEX "workouts_session_id_idx" ON "public"."workouts" USING "btree" ("session_id");



CREATE OR REPLACE TRIGGER "coach_athletes_status_tracking" BEFORE UPDATE ON "public"."coach_athletes" FOR EACH ROW EXECUTE FUNCTION "public"."track_coach_athletes_status_changes"();



CREATE OR REPLACE TRIGGER "enforce_role_consistency" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_consistent_role"();



CREATE OR REPLACE TRIGGER "update_exercises_updated_at" BEFORE UPDATE ON "public"."exercises" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_programs_updated_at" BEFORE UPDATE ON "public"."programs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workouts_updated_at" BEFORE UPDATE ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."coach_athletes"
    ADD CONSTRAINT "coach_athletes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."coach_athletes"
    ADD CONSTRAINT "coach_athletes_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_assignments"
    ADD CONSTRAINT "program_assignments_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_assignments"
    ADD CONSTRAINT "program_assignments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("session_id") ON DELETE CASCADE;



CREATE POLICY "Athletes can view assigned programs" ON "public"."programs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."program_assignments" "pa"
  WHERE (("pa"."program_id" = "programs"."id") AND ("pa"."athlete_id" = "auth"."uid"())))));



CREATE POLICY "Athletes can view sessions for assigned programs" ON "public"."sessions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."program_assignments" "pa"
     JOIN "public"."programs" "p" ON (("p"."id" = "sessions"."program_id")))
  WHERE (("pa"."program_id" = "sessions"."program_id") AND ("pa"."athlete_id" = "auth"."uid"())))));



CREATE POLICY "Coaches can CRUD sessions for their programs" ON "public"."sessions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."programs"
  WHERE (("programs"."id" = "sessions"."program_id") AND ("programs"."coach_id" = "auth"."uid"())))));



CREATE POLICY "Coaches can manage their programs" ON "public"."programs" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "allow_all_for_authenticated_users" ON "public"."program_assignments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "athletes_can_request_coaches" ON "public"."coach_athletes" FOR INSERT WITH CHECK ((("athlete_id" = "auth"."uid"()) AND ("status" = 'pending'::"text") AND (NOT (EXISTS ( SELECT 1
   FROM "public"."coach_athletes" "coach_athletes_1"
  WHERE (("coach_athletes_1"."athlete_id" = "auth"."uid"()) AND ("coach_athletes_1"."coach_id" = "coach_athletes_1"."coach_id") AND ("coach_athletes_1"."status" = ANY (ARRAY['pending'::"text", 'active'::"text"]))))))));



CREATE POLICY "athletes_update_coach_status" ON "public"."coach_athletes" FOR UPDATE USING (("athlete_id" = "auth"."uid"())) WITH CHECK ((("athlete_id" = "auth"."uid"()) AND (("status" = 'inactive'::"text") OR ("status" = 'pending'::"text"))));



CREATE POLICY "athletes_view_all_coaches" ON "public"."coach_athletes" FOR SELECT USING (("athlete_id" = "auth"."uid"()));



CREATE POLICY "athletes_view_coaches" ON "public"."coach_athletes" FOR SELECT USING ((("athlete_id" = "auth"."uid"()) AND ("status" = ANY (ARRAY['active'::"text", 'pending'::"text"]))));



CREATE POLICY "authenticated_can_view_coaches" ON "public"."profiles" FOR SELECT USING (("role" = 'coach'::"text"));



ALTER TABLE "public"."coach_athletes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coach_search_includes_inactive" ON "public"."coach_athletes" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "coaches_manage_athletes" ON "public"."coach_athletes" USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "coaches_update_athlete_status" ON "public"."coach_athletes" FOR UPDATE USING (("coach_id" = "auth"."uid"())) WITH CHECK (("coach_id" = "auth"."uid"()));



CREATE POLICY "coaches_view_athlete_profiles" ON "public"."profiles" FOR SELECT USING (("id" IN ( SELECT "coach_athletes"."athlete_id"
   FROM "public"."coach_athletes"
  WHERE ("coach_athletes"."coach_id" = "auth"."uid"()))));



CREATE POLICY "coaches_view_athletes" ON "public"."coach_athletes" FOR SELECT USING (("coach_id" = "auth"."uid"()));



CREATE POLICY "coaches_view_pending_requests" ON "public"."coach_athletes" FOR SELECT USING (("coach_id" = "auth"."uid"()));



ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_own_access" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_public_coach_view" ON "public"."profiles" FOR SELECT USING (("role" = 'coach'::"text"));



ALTER TABLE "public"."program_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."add_missing_profile"("user_id" "uuid", "role" "text", "full_name" "text", "email" "text", "avatar_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_missing_profile"("user_id" "uuid", "role" "text", "full_name" "text", "email" "text", "avatar_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_missing_profile"("user_id" "uuid", "role" "text", "full_name" "text", "email" "text", "avatar_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_athlete_role_for_team_members"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_athlete_role_for_team_members"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_athlete_role_for_team_members"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_coach_role_for_teams"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_coach_role_for_teams"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_coach_role_for_teams"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_consistent_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_consistent_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_consistent_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_coach_athletes_status_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_coach_athletes_status_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_coach_athletes_status_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_athlete_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_athlete_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_athlete_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_coach_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_coach_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_coach_role"() TO "service_role";


















GRANT ALL ON TABLE "public"."coach_athletes" TO "anon";
GRANT ALL ON TABLE "public"."coach_athletes" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_athletes" TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."program_assignments" TO "anon";
GRANT ALL ON TABLE "public"."program_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."program_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."workouts" TO "anon";
GRANT ALL ON TABLE "public"."workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."workouts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



