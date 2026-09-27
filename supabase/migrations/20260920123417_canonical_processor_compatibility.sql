-- Additive compatibility for canonical generated Daily and persisted progression bonuses.
-- Existing claims/ledger and older quest rules remain valid. No client reward amounts are used.
alter table private.sync_quest_rules add column minimum_level integer not null default 1 check(minimum_level>=1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_RESET_EASY',30,3,'{"VIT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_reset_easy','GENERATED_WALK_RESET_EASY','GPS_DISTANCE',70,600,1,'WALK','{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_RESET_NORMAL',50,5,'{"VIT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_reset_normal','GENERATED_WALK_RESET_NORMAL','GPS_DISTANCE',70,900,1,'WALK','{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_RESET_HARD',75,7,'{"VIT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_reset_hard','GENERATED_WALK_RESET_HARD','GPS_DISTANCE',70,1200,1,'WALK','{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_FRESH_EASY',30,3,'{"VIT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_fresh_easy','GENERATED_WALK_FRESH_EASY','GPS_DISTANCE',70,600,1,'WALK','{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_FRESH_NORMAL',50,5,'{"VIT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_fresh_normal','GENERATED_WALK_FRESH_NORMAL','GPS_DISTANCE',70,900,1,'WALK','{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_FRESH_HARD',75,7,'{"VIT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_fresh_hard','GENERATED_WALK_FRESH_HARD','GPS_DISTANCE',70,1200,1,'WALK','{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_BREAK_EASY',30,3,'{"VIT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_break_easy','GENERATED_WALK_BREAK_EASY','GPS_DISTANCE',70,600,1,'WALK','{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_BREAK_NORMAL',50,5,'{"VIT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_break_normal','GENERATED_WALK_BREAK_NORMAL','GPS_DISTANCE',70,900,1,'WALK','{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_BREAK_HARD',75,7,'{"VIT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_break_hard','GENERATED_WALK_BREAK_HARD','GPS_DISTANCE',70,1200,1,'WALK','{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_ROUTE_EASY',30,3,'{"VIT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_route_easy','GENERATED_WALK_ROUTE_EASY','GPS_DISTANCE',70,600,1,'WALK','{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_ROUTE_NORMAL',50,5,'{"VIT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_route_normal','GENERATED_WALK_ROUTE_NORMAL','GPS_DISTANCE',70,900,1,'WALK','{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_WALK_ROUTE_HARD',75,7,'{"VIT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_walk_route_hard','GENERATED_WALK_ROUTE_HARD','GPS_DISTANCE',70,1200,1,'WALK','{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_RUN_EASY_EASY',30,3,'{"VIT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_run_easy_easy','GENERATED_RUN_EASY_EASY','GPS_DISTANCE',70,500,1,'RUN','{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_RUN_EASY_NORMAL',50,5,'{"VIT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_run_easy_normal','GENERATED_RUN_EASY_NORMAL','GPS_DISTANCE',70,750,1,'RUN','{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_RUN_EASY_HARD',75,7,'{"VIT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_run_easy_hard','GENERATED_RUN_EASY_HARD','GPS_DISTANCE',70,1000,1,'RUN','{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_RIDE_EASY_EASY',30,3,'{"VIT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_ride_easy_easy','GENERATED_RIDE_EASY_EASY','GPS_DISTANCE',70,1500,1,'BIKE','{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_RIDE_EASY_NORMAL',50,5,'{"VIT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_ride_easy_normal','GENERATED_RIDE_EASY_NORMAL','GPS_DISTANCE',70,2250,1,'BIKE','{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_RIDE_EASY_HARD',75,7,'{"VIT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_ride_easy_hard','GENERATED_RIDE_EASY_HARD','GPS_DISTANCE',70,3000,1,'BIKE','{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_STRENGTH_EASY',30,3,'{"INT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_strength_easy','GENERATED_FOCUS_STRENGTH_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_STRENGTH_NORMAL',50,5,'{"INT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_strength_normal','GENERATED_FOCUS_STRENGTH_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_STRENGTH_HARD',75,7,'{"INT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_strength_hard','GENERATED_FOCUS_STRENGTH_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_MOBILITY_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_mobility_easy','GENERATED_FOCUS_MOBILITY_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_MOBILITY_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_mobility_normal','GENERATED_FOCUS_MOBILITY_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_MOBILITY_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_mobility_hard','GENERATED_FOCUS_MOBILITY_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_BEGIN_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_begin_easy','GENERATED_FOCUS_BEGIN_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_BEGIN_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_begin_normal','GENERATED_FOCUS_BEGIN_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_BEGIN_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_begin_hard','GENERATED_FOCUS_BEGIN_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_MORNING_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_morning_easy','GENERATED_FOCUS_MORNING_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_MORNING_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_morning_normal','GENERATED_FOCUS_MORNING_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_MORNING_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_morning_hard','GENERATED_FOCUS_MORNING_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_EVENING_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_evening_easy','GENERATED_FOCUS_EVENING_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_EVENING_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_evening_normal','GENERATED_FOCUS_EVENING_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_EVENING_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_evening_hard','GENERATED_FOCUS_EVENING_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DISTRACTION_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_distraction_easy','GENERATED_FOCUS_DISTRACTION_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DISTRACTION_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_distraction_normal','GENERATED_FOCUS_DISTRACTION_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DISTRACTION_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_distraction_hard','GENERATED_FOCUS_DISTRACTION_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_RETURN_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_return_easy','GENERATED_FOCUS_RETURN_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_RETURN_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_return_normal','GENERATED_FOCUS_RETURN_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_RETURN_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_return_hard','GENERATED_FOCUS_RETURN_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_PRIORITY_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_priority_easy','GENERATED_FOCUS_PRIORITY_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_PRIORITY_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_priority_normal','GENERATED_FOCUS_PRIORITY_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_PRIORITY_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_priority_hard','GENERATED_FOCUS_PRIORITY_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_BACKLOG_EASY',30,3,'{"RES":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_backlog_easy','GENERATED_FOCUS_BACKLOG_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_BACKLOG_NORMAL',50,5,'{"RES":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_backlog_normal','GENERATED_FOCUS_BACKLOG_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_BACKLOG_HARD',75,7,'{"RES":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_backlog_hard','GENERATED_FOCUS_BACKLOG_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_PLAN_EASY',30,3,'{"INT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_plan_easy','GENERATED_FOCUS_PLAN_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_PLAN_NORMAL',50,5,'{"INT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_plan_normal','GENERATED_FOCUS_PLAN_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_PLAN_HARD',75,7,'{"INT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_plan_hard','GENERATED_FOCUS_PLAN_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DRAFT_EASY',30,3,'{"CRE":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_draft_easy','GENERATED_FOCUS_DRAFT_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DRAFT_NORMAL',50,5,'{"CRE":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_draft_normal','GENERATED_FOCUS_DRAFT_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DRAFT_HARD',75,7,'{"CRE":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_draft_hard','GENERATED_FOCUS_DRAFT_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_REVIEW_EASY',30,3,'{"INT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_review_easy','GENERATED_FOCUS_REVIEW_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_REVIEW_NORMAL',50,5,'{"INT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_review_normal','GENERATED_FOCUS_REVIEW_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_REVIEW_HARD',75,7,'{"INT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_review_hard','GENERATED_FOCUS_REVIEW_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_READ_EASY',30,3,'{"INT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_read_easy','GENERATED_LEARN_READ_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_READ_NORMAL',50,5,'{"INT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_read_normal','GENERATED_LEARN_READ_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_READ_HARD',75,7,'{"INT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_read_hard','GENERATED_LEARN_READ_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_RECALL_EASY',30,3,'{"INT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_recall_easy','GENERATED_LEARN_RECALL_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_RECALL_NORMAL',50,5,'{"INT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_recall_normal','GENERATED_LEARN_RECALL_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_RECALL_HARD',75,7,'{"INT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_recall_hard','GENERATED_LEARN_RECALL_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_LANGUAGE_EASY',30,3,'{"INT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_language_easy','GENERATED_LEARN_LANGUAGE_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_LANGUAGE_NORMAL',50,5,'{"INT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_language_normal','GENERATED_LEARN_LANGUAGE_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_LANGUAGE_HARD',75,7,'{"INT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_language_hard','GENERATED_LEARN_LANGUAGE_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_QUESTION_EASY',30,3,'{"INT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_question_easy','GENERATED_LEARN_QUESTION_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_QUESTION_NORMAL',50,5,'{"INT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_question_normal','GENERATED_LEARN_QUESTION_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_QUESTION_HARD',75,7,'{"INT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_question_hard','GENERATED_LEARN_QUESTION_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_EXPLAIN_EASY',30,3,'{"INT":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_explain_easy','GENERATED_LEARN_EXPLAIN_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_EXPLAIN_NORMAL',50,5,'{"INT":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_explain_normal','GENERATED_LEARN_EXPLAIN_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_LEARN_EXPLAIN_HARD',75,7,'{"INT":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_learn_explain_hard','GENERATED_LEARN_EXPLAIN_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_PLAN_EASY',30,3,'{"CHA":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_plan_easy','GENERATED_FOCUS_SOCIAL_PLAN_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_PLAN_NORMAL',50,5,'{"CHA":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_plan_normal','GENERATED_FOCUS_SOCIAL_PLAN_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_PLAN_HARD',75,7,'{"CHA":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_plan_hard','GENERATED_FOCUS_SOCIAL_PLAN_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_MESSAGE_EASY',30,3,'{"CHA":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_message_easy','GENERATED_FOCUS_SOCIAL_MESSAGE_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_MESSAGE_NORMAL',50,5,'{"CHA":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_message_normal','GENERATED_FOCUS_SOCIAL_MESSAGE_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_MESSAGE_HARD',75,7,'{"CHA":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_message_hard','GENERATED_FOCUS_SOCIAL_MESSAGE_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_LISTEN_EASY',30,3,'{"CHA":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_listen_easy','GENERATED_FOCUS_SOCIAL_LISTEN_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_LISTEN_NORMAL',50,5,'{"CHA":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_listen_normal','GENERATED_FOCUS_SOCIAL_LISTEN_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_LISTEN_HARD',75,7,'{"CHA":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_listen_hard','GENERATED_FOCUS_SOCIAL_LISTEN_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_THANKS_EASY',30,3,'{"CHA":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_thanks_easy','GENERATED_FOCUS_SOCIAL_THANKS_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_THANKS_NORMAL',50,5,'{"CHA":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_thanks_normal','GENERATED_FOCUS_SOCIAL_THANKS_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_SOCIAL_THANKS_HARD',75,7,'{"CHA":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_social_thanks_hard','GENERATED_FOCUS_SOCIAL_THANKS_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_SPACE_EASY',30,3,'{"RES":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_space_easy','GENERATED_ORGANIZE_SPACE_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_SPACE_NORMAL',50,5,'{"RES":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_space_normal','GENERATED_ORGANIZE_SPACE_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_SPACE_HARD',75,7,'{"RES":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_space_hard','GENERATED_ORGANIZE_SPACE_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_TOMORROW_EASY',30,3,'{"RES":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_tomorrow_easy','GENERATED_ORGANIZE_TOMORROW_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_TOMORROW_NORMAL',50,5,'{"RES":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_tomorrow_normal','GENERATED_ORGANIZE_TOMORROW_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_TOMORROW_HARD',75,7,'{"RES":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_tomorrow_hard','GENERATED_ORGANIZE_TOMORROW_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_ROUTINE_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_routine_easy','GENERATED_ORGANIZE_ROUTINE_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_ROUTINE_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_routine_normal','GENERATED_ORGANIZE_ROUTINE_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_ROUTINE_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_routine_hard','GENERATED_ORGANIZE_ROUTINE_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_FILES_EASY',30,3,'{"RES":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_files_easy','GENERATED_ORGANIZE_FILES_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_FILES_NORMAL',50,5,'{"RES":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_files_normal','GENERATED_ORGANIZE_FILES_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_ORGANIZE_FILES_HARD',75,7,'{"RES":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_organize_files_hard','GENERATED_ORGANIZE_FILES_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_CREATE_NOTE_EASY',30,3,'{"CRE":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_create_note_easy','GENERATED_CREATE_NOTE_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_CREATE_NOTE_NORMAL',50,5,'{"CRE":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_create_note_normal','GENERATED_CREATE_NOTE_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_CREATE_NOTE_HARD',75,7,'{"CRE":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_create_note_hard','GENERATED_CREATE_NOTE_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DIRECTION_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_direction_easy','GENERATED_FOCUS_DIRECTION_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DIRECTION_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_direction_normal','GENERATED_FOCUS_DIRECTION_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_DIRECTION_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_direction_hard','GENERATED_FOCUS_DIRECTION_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_CREATE_SKETCH_EASY',30,3,'{"CRE":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_create_sketch_easy','GENERATED_CREATE_SKETCH_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_CREATE_SKETCH_NORMAL',50,5,'{"CRE":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_create_sketch_normal','GENERATED_CREATE_SKETCH_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_CREATE_SKETCH_HARD',75,7,'{"CRE":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_create_sketch_hard','GENERATED_CREATE_SKETCH_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_REFLECT_EASY',30,3,'{"WIL":25}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_reflect_easy','GENERATED_FOCUS_REFLECT_EASY','TIMER',100,0,300,null,'{awakening_chapter_1}','DIRECT',1);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_REFLECT_NORMAL',50,5,'{"WIL":40}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_reflect_normal','GENERATED_FOCUS_REFLECT_NORMAL','TIMER',100,0,450,null,'{awakening_chapter_1}','DIRECT',3);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('GENERATED_FOCUS_REFLECT_HARD',75,7,'{"WIL":60}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,minimum_distance,minimum_duration,activity_type,prerequisites,evidence_kind,minimum_level) values('daily:g1_focus_reflect_hard','GENERATED_FOCUS_REFLECT_HARD','TIMER',100,0,600,null,'{awakening_chapter_1}','DIRECT',8);
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('PROGRESSION_WEEKLY_QUEST_MASTER',200,20,'{}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,evidence_kind) values('progression:weekly_quest_master','PROGRESSION_WEEKLY_QUEST_MASTER','MULTI',100,'PROGRESSION');
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('PROGRESSION_WEEKLY_DAILY_CONSISTENCY',150,15,'{}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,evidence_kind) values('progression:weekly_daily_consistency','PROGRESSION_WEEKLY_DAILY_CONSISTENCY','MULTI',100,'PROGRESSION');
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('PROGRESSION_WEEKLY_PATHFINDER',180,18,'{}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,evidence_kind) values('progression:weekly_pathfinder','PROGRESSION_WEEKLY_PATHFINDER','MULTI',100,'PROGRESSION');
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('PROGRESSION_WEEKLY_STREAK_KEEPER',250,25,'{}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,evidence_kind) values('progression:weekly_streak_keeper','PROGRESSION_WEEKLY_STREAK_KEEPER','MULTI',100,'PROGRESSION');
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('PROGRESSION_MILESTONE_3',50,5,'{}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,evidence_kind) values('progression:milestone_3','PROGRESSION_MILESTONE_3','MULTI',100,'PROGRESSION');
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('PROGRESSION_MILESTONE_7',76,8,'{}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,evidence_kind) values('progression:milestone_7','PROGRESSION_MILESTONE_7','MULTI',100,'PROGRESSION');
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('PROGRESSION_MILESTONE_14',108,11,'{}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,evidence_kind) values('progression:milestone_14','PROGRESSION_MILESTONE_14','MULTI',100,'PROGRESSION');
insert into public.reward_catalog(reward_code,real_xp,energy,skill_rewards) values('PROGRESSION_MILESTONE_30',158,16,'{}') on conflict(reward_code) do nothing;
insert into private.sync_quest_rules(rule_key,reward_code,verification_type,minimum_score,evidence_kind) values('progression:milestone_30','PROGRESSION_MILESTONE_30','MULTI',100,'PROGRESSION');

-- Only accepted DIRECT evidence counts. Derived rewards cannot recursively earn bonuses.
-- Daily IDs retain their validated local day. Other evidence uses its bounded client
-- completion timestamp (UTC), falling back to server receive time for legacy events.
create function private.sync_progression_eligible(p_user uuid,p_claim text) returns boolean
language sql stable set search_path='' as $$
with direct as (
 select l.source_id, case when r.verification_type in ('GPS_DISTANCE','MULTI') then coalesce((se.payload->>'distance_meters')::numeric,0) else 0 end as distance_meters,
   case when l.source_id like 'daily:%' then split_part(l.source_id,':',2)::date
     when se.payload ? 'completed_day' then (se.payload->>'completed_day')::date
     when se.client_created_at between timestamptz '2026-09-18 00:00:00+00' and se.created_at+interval '1 day'
       then (se.client_created_at at time zone 'UTC')::date
     else (se.created_at at time zone 'UTC')::date end as effective_day
 from public.reward_ledger l
 join public.sync_events se on se.user_id=l.user_id and se.event_key=l.evidence_event_key
 join public.verification_summaries v on v.user_id=l.user_id and v.event_key=l.evidence_event_key and v.verdict='VERIFIED'
 join private.sync_quest_rules r on r.rule_key=case when l.source_id like 'daily:%' then 'daily:'||split_part(l.source_id,':',3) else l.source_id end
 where l.user_id=p_user and l.source_type='VERIFIED_EVENT' and r.evidence_kind='DIRECT'
), clear_days as (
 select distinct substring(l.source_id from 13)::date as day
 from public.reward_ledger l where l.user_id=p_user and l.source_type='VERIFIED_EVENT'
 and l.reward_code='DAILY_CLEAR' and l.source_id ~ '^daily_clear:[0-9]{4}-[0-9]{2}-[0-9]{2}$'
), runs as (
 select day,day-(row_number() over(order by day))::integer as grp from clear_days
), lengths as (
 select day,row_number() over(partition by grp order by day) as n from runs
)
select case
 when p_claim ~ '^progression:milestone:(3|7|14|30)$' then
   coalesce((select max(n) from lengths),0)>=split_part(p_claim,':',3)::integer
 when split_part(p_claim,':',2)='weekly' then case split_part(p_claim,':',4)
   when 'weekly_quest_master' then (select count(*) from direct where to_char(effective_day,'IYYY-"W"IW')=split_part(p_claim,':',3))>=5
   when 'weekly_daily_consistency' then (select count(distinct effective_day) from direct where source_id like 'daily:%' and to_char(effective_day,'IYYY-"W"IW')=split_part(p_claim,':',3))>=3
   when 'weekly_pathfinder' then (select coalesce(sum(distance_meters),0) from direct where to_char(effective_day,'IYYY-"W"IW')=split_part(p_claim,':',3))>=10000
   when 'weekly_streak_keeper' then exists(select 1 from lengths where n>=7 and to_char(day,'IYYY-"W"IW')=split_part(p_claim,':',3))
   else false end
 else false end;
$$;
revoke all on function private.sync_progression_eligible(uuid,text) from public,anon,authenticated;

create or replace function private.process_verified_sync_event(p_id uuid, p_user uuid) returns text
language plpgsql set search_path = '' as $$
declare
  e public.sync_events%rowtype;
  r private.sync_quest_rules%rowtype;
  reward public.reward_catalog%rowtype;
  q text; v_rule_key text; reason text; v_claim_key text; claimed uuid;
  score numeric; distance numeric := 0; duration numeric := 0;
  day date; parts text[]; total bigint; progress record; skill record;
begin
  -- Every entry point locks the user before any event/progression row. Same-user
  -- batches and single-event calls therefore have the same deadlock-free order.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 41901));
  select * into e from public.sync_events where id=p_id and user_id=p_user for update;
  if not found then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
  if e.processing_status in ('PROCESSED','REJECTED') then return e.processing_status; end if;
  begin
    update public.sync_events set processing_status='PROCESSING',processing_attempted_at=clock_timestamp(),rejection_reason=null where id=e.id;
    q := e.payload->>'quest_id'; v_rule_key := q;
    if e.entity_type <> 'VERIFIED_EVENT' then reason := 'UNSUPPORTED_EVENT';
    elsif jsonb_typeof(e.payload) is distinct from 'object' or e.schema_version <> 1
      or e.event_key !~ '^[A-Za-z0-9._:-]{1,180}$'
      or jsonb_typeof(e.payload->'quest_id') is distinct from 'string'
      or length(q) not between 1 and 180 or e.entity_id is distinct from q
      or (e.payload ? 'user_id' and e.payload->>'user_id' is distinct from p_user::text)
      or jsonb_typeof(e.payload->'verification_score') is distinct from 'number'
      or jsonb_typeof(e.payload->'verification_type') is distinct from 'string'
      then reason := 'INVALID_PAYLOAD';
    else
      score := (e.payload->>'verification_score')::numeric;
      if e.payload ? 'distance_meters' then
        if jsonb_typeof(e.payload->'distance_meters') is distinct from 'number' then reason := 'INVALID_PAYLOAD';
        else distance := (e.payload->>'distance_meters')::numeric; end if;
      end if;
      if e.payload ? 'duration_seconds' then
        if jsonb_typeof(e.payload->'duration_seconds') is distinct from 'number' then reason := 'INVALID_PAYLOAD';
        else duration := (e.payload->>'duration_seconds')::numeric; end if;
      end if;
      if distance not between 0 and 500000 or duration not between 0 and 172800 then reason := 'INVALID_PAYLOAD'; end if;
      if score not between 0 and 100 then reason := 'INVALID_VERIFICATION'; end if;
      if q like 'daily:%' then
        parts := regexp_match(q, '^daily:([0-9]{4}-[0-9]{2}-[0-9]{2}):([a-z0-9_]+)$');
        if parts is null then reason := 'UNKNOWN_QUEST';
        else
          begin day := parts[1]::date; exception when others then reason := 'INVALID_PAYLOAD'; end;
          -- Offline delivery may be late. The server receive date bounds future
          -- claims; client_created_at cannot make a future Daily eligible.
          if day < date '2026-09-18' or day > (e.created_at at time zone 'UTC')::date + 1 then reason := 'INVALID_PAYLOAD'; end if;
          v_rule_key := 'daily:' || parts[2];
        end if;
      elsif q ~ '^daily_clear:[0-9]{4}-[0-9]{2}-[0-9]{2}$' then v_rule_key := 'daily_clear';
      elsif q ~ '^weekly_complete:[0-9]{4}-W[0-9]{2}$' then v_rule_key := 'weekly_complete';
      elsif q like 'progression:%' then
        parts := regexp_match(q,'^progression:[A-Za-z0-9._:-]+:(weekly:[0-9]{4}-W[0-9]{2}:weekly_(quest_master|daily_consistency|pathfinder|streak_keeper)|milestone:(3|7|14|30))$');
        if parts is null then reason := 'UNKNOWN_QUEST';
        else
          -- Normalize away the local profile ID; auth.uid owns the claim.
          q := 'progression:'||parts[1];
          if split_part(q,':',2)='weekly' then
            v_rule_key := 'progression:'||split_part(q,':',4);
            begin
              day := to_date(split_part(q,':',3)||'-1','IYYY-"W"IW-ID');
              if to_char(day,'IYYY-"W"IW')<>split_part(q,':',3) or day>(e.created_at at time zone 'UTC')::date+1 then reason:='INVALID_PAYLOAD'; end if;
            exception when others then reason:='INVALID_PAYLOAD'; end;
          else v_rule_key := 'progression:milestone_'||split_part(q,':',3); end if;
        end if;
      elsif q like 'rematch:%' then v_rule_key := 'rematch'; end if;
      if v_rule_key='daily_clear' then
        begin
          day := substring(q from 13)::date;
          if day < date '2026-09-18' or day > (e.created_at at time zone 'UTC')::date+1 then reason := 'INVALID_PAYLOAD'; end if;
        exception when others then reason := 'INVALID_PAYLOAD'; end;
      elsif v_rule_key='weekly_complete' then
        begin
          day := to_date(substring(q from 17)||'-1','IYYY-"W"IW-ID');
          if to_char(day,'IYYY-"W"IW') <> substring(q from 17)
            or day < date '2026-09-14' or day > (e.created_at at time zone 'UTC')::date+1 then reason := 'INVALID_PAYLOAD'; end if;
        exception when others then reason := 'INVALID_PAYLOAD'; end;
      end if;
      select * into r from private.sync_quest_rules rules where rules.rule_key=v_rule_key;
      if not found then reason := coalesce(reason,'UNKNOWN_QUEST');
      elsif reason is null then
        if e.payload->>'verification_type' <> r.verification_type or score < r.minimum_score
          or score <> trunc(score) then reason := 'INVALID_VERIFICATION';
        elsif distance < r.minimum_distance then reason := 'BELOW_DISTANCE';
        elsif duration < r.minimum_duration then reason := 'BELOW_DURATION';
        elsif r.minimum_distance > 0 and distance / greatest(duration,1) >
          (case when r.activity_type='BIKE' then 25 when r.activity_type='RUN' then 12
            when r.activity_type='WALK' then 7 else 8.5 end)
          then reason := 'INVALID_VERIFICATION';
        elsif r.activity_type is not null and (jsonb_typeof(e.payload->'activity') is distinct from 'object'
          or e.payload#>>'{activity,expected}' is distinct from r.activity_type
          or e.payload#>>'{activity,detected}' is distinct from r.activity_type
          or e.payload#>>'{activity,verdict}' is distinct from 'VERIFIED') then reason := 'INVALID_VERIFICATION';
        end if;
      end if;
    end if;

    if reason is null and exists (
      select 1 from unnest(r.prerequisites) needed where not exists (
        select 1 from public.reward_ledger l where l.user_id=p_user and l.source_type='VERIFIED_EVENT' and l.source_id=needed
      )
    ) then
      -- Arrival order is not proof of cheating. Revisit after prerequisite sync.
      update public.sync_events set processing_status='RECEIVED',rejection_reason='MISSING_PREREQUISITE' where id=e.id;
      return 'RECEIVED';
    end if;

    if reason is null and r.minimum_level>(select real_level from public.player_progress where user_id=p_user) then
      update public.sync_events set processing_status='RECEIVED',rejection_reason='MISSING_PREREQUISITE' where id=e.id;
      return 'RECEIVED';
    end if;
    if reason is null and r.evidence_kind='PROGRESSION' and not private.sync_progression_eligible(p_user,q) then
      update public.sync_events set processing_status='RECEIVED',rejection_reason='MISSING_PREREQUISITE' where id=e.id;
      return 'RECEIVED';
    end if;

    -- Local calendar attribution is bounded by the accepted completion timestamp.
    -- Older clients omit this field and retain the documented UTC fallback.
    if reason is null and r.evidence_kind='DIRECT' and e.payload ? 'completed_day' then
      begin
        if jsonb_typeof(e.payload->'completed_day')<>'string' or (e.payload->>'completed_day') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          or abs((e.payload->>'completed_day')::date - (coalesce(e.client_created_at,e.created_at) at time zone 'UTC')::date)>1
          or (e.payload->>'completed_day')::date>(e.created_at at time zone 'UTC')::date+1
          or (e.payload->>'completed_day')::date<date '2026-09-18'
          or e.client_created_at>e.created_at+interval '1 day'
        then reason:='INVALID_PAYLOAD'; end if;
      exception when others then reason:='INVALID_PAYLOAD'; end;
    end if;

    -- Same daily slot limits as mobile generateDaily; local preference/seed IDs
    -- are not cloud identities, so only the allowed template and slot budget is
    -- authoritative here. A new event key cannot create a fourth daily reward.
    if reason is null and q like 'daily:%' and not exists (
      select 1 from public.reward_ledger l where l.user_id=p_user and l.ledger_key='sync-quest:'||q
    ) and ((select count(*) from public.quest_completions c where c.user_id=p_user
      and c.quest_id like 'daily:'||day::text||':%') >= 3
      or (r.activity_type is not null and r.rule_key not like 'daily:g1_%' and exists (
        select 1 from public.quest_completions c join private.sync_quest_rules rules
          on rules.rule_key='daily:'||split_part(c.quest_id,':',3)
        where c.user_id=p_user and c.quest_id like 'daily:'||day::text||':%' and rules.activity_type is not null
      ))) then reason := 'DAILY_LIMIT'; end if;

    -- Derived rewards require existing server-owned evidence, never a client's
    -- claimed completion, reward code or XP. Unsupported evidence fails closed.
    if reason is null then
      if r.evidence_kind='DAILY_CLEAR' and (select count(*) from public.quest_completions c
        where c.user_id=p_user and c.quest_id like 'daily:'||substring(q from 13)||':%') < 3 then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WEEKLY_COMPLETE' and (select count(*) from public.quest_completions c
        where c.user_id=p_user and c.quest_id ~ '^daily:[0-9]{4}-[0-9]{2}-[0-9]{2}:'
          and to_char(substring(c.quest_id from 7 for 10)::date,'IYYY-"W"IW')=substring(q from 17)) < 5 then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WORLD_SIGNAL' and not exists (select 1 from public.world_signals w
        where w.user_id=p_user and w.signal_id=q and w.status='LOCATED') then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='WORLD_LINK' and ((select count(*) from public.world_sectors w where w.user_id=p_user)<3
        or not exists(select 1 from public.reward_ledger l where l.user_id=p_user and l.reward_code='DAILY_CLEAR')) then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='EXTRA_MILE' and not exists (
        select 1 from public.verification_summaries v join public.sync_events se on se.user_id=v.user_id and se.event_key=v.event_key
        join private.sync_quest_rules rules on rules.rule_key='daily:'||split_part(se.entity_id,':',3)
        where v.user_id=p_user and v.verdict='VERIFIED' and rules.minimum_distance>0 and v.distance_meters>=rules.minimum_distance*1.25
      ) then reason := 'MISSING_PREREQUISITE';
      elsif r.evidence_kind='COMEBACK' then reason := 'UNSUPPORTED_EVENT';
      elsif r.evidence_kind='BOSS_COMPLETE' and not exists (
        select 1 from public.boss_progress b where b.user_id=p_user and b.boss_id=q and b.status='COMPLETED'
      ) then reason := 'MISSING_PREREQUISITE';
      end if;
    end if;
    if reason = 'MISSING_PREREQUISITE' then
      update public.sync_events set processing_status='RECEIVED',rejection_reason=reason where id=e.id;
      return 'RECEIVED';
    end if;
    if reason is not null then
      update public.sync_events set processing_status='REJECTED',rejection_reason=reason,processed_at=now() where id=e.id;
      return 'REJECTED';
    end if;

    select * into strict reward from public.reward_catalog where reward_code=r.reward_code and active;
    v_claim_key := 'sync-quest:' || q;
    -- Canonical quest IDs deduplicate alternate event keys/devices as well.
    if exists(select 1 from public.reward_ledger l where l.user_id=p_user and (l.ledger_key=v_claim_key or l.evidence_event_key=e.event_key or (l.source_id=q and l.reward_code=r.reward_code))) then
      update public.sync_events set processing_status='REJECTED',rejection_reason='DUPLICATE',processed_at=now() where id=e.id;
      return 'REJECTED';
    end if;
    insert into public.reward_claims(user_id,claim_key,reward_code,source_type,source_id,evidence_event_key,status,processed_at)
      values(p_user,v_claim_key,r.reward_code,'VERIFIED_EVENT',q,e.event_key,'APPROVED',now())
      on conflict(user_id,claim_key) do update set reward_code=excluded.reward_code,
        source_type=excluded.source_type,source_id=excluded.source_id,evidence_event_key=excluded.evidence_event_key,
        status='APPROVED',processed_at=excluded.processed_at,rejection_reason=null
        where public.reward_claims.status='PENDING'
      returning id into claimed;
    if claimed is null then raise exception 'CLAIM_CONFLICT'; end if;
    insert into public.reward_ledger(user_id,ledger_key,reward_code,real_xp,energy,skill_rewards,title_key,source_type,source_id,evidence_event_key)
      values(p_user,v_claim_key,r.reward_code,reward.real_xp,reward.energy,reward.skill_rewards,reward.title_key,'VERIFIED_EVENT',q,e.event_key);
    select real_total_xp + reward.real_xp into strict total from public.player_progress where user_id=p_user for update;
    select * into progress from private.sync_progress(total);
    update public.player_progress set real_total_xp=total,real_level=progress.level,real_xp=progress.xp,
      rank=private.sync_rank(progress.level),energy=energy+reward.energy,
      evolution_stage=case when progress.level>=25 then 2 when progress.level>=10 then 1 else 0 end,
      revision=revision+1,updated_at=now() where user_id=p_user;
    for skill in select key,value from jsonb_each(reward.skill_rewards) loop
      if skill.key not in ('STR','VIT','INT','WIL','CHA','CRE','RES') or jsonb_typeof(skill.value)<>'number'
        or skill.value::text::numeric not between 0 and 100000 or skill.value::text::numeric<>trunc(skill.value::text::numeric) then
        raise exception 'INVALID_SERVER_REWARD';
      end if;
      insert into public.skill_progress(user_id,skill_key) values(p_user,skill.key) on conflict do nothing;
      select total_xp + skill.value::text::bigint into total from public.skill_progress where user_id=p_user and skill_key=skill.key for update;
      select * into progress from private.sync_progress(total,true);
      update public.skill_progress set total_xp=total,level=progress.level,xp=progress.xp,revision=revision+1,updated_at=now()
        where user_id=p_user and skill_key=skill.key;
    end loop;
    insert into public.verification_summaries(user_id,event_key,activity_type,verdict,confidence_score,distance_meters,duration_seconds,reason_codes)
      values(p_user,e.event_key,r.activity_type,'VERIFIED',score::integer,floor(distance)::integer,floor(duration)::integer,'[]');
    insert into public.quest_completions(user_id,completion_key,quest_id,quest_instance_id,reward_fingerprint)
      values(p_user,v_claim_key,q,q,r.reward_code) on conflict(user_id,completion_key) do nothing;
    if reward.title_key is not null then
      insert into public.title_unlocks(user_id,title_key,source_type,source_id) values(p_user,reward.title_key,'VERIFIED_EVENT',q) on conflict do nothing;
    end if;
    update public.sync_events set processing_status='PROCESSED',processed_at=now(),rejection_reason=null where id=e.id;
    return 'PROCESSED';
  exception when others then
    -- This exception block is a savepoint: no partial claim/ledger/progression.
    -- Never expose SQLERRM, stack traces or privileged details to the client.
    update public.sync_events set processing_status='RECEIVED',processed_at=null,processing_attempted_at=clock_timestamp(),rejection_reason='PROCESSING_ERROR' where id=e.id;
    return 'RECEIVED';
  end;
end;
$$;


-- A mobile update may have reached the previous processor first. Revalidate only
-- newly recognized UNKNOWN_QUEST events; never replay settled ledger entries.
update public.sync_events e set processing_status='RECEIVED',rejection_reason=null,processed_at=null,processing_attempted_at=null
where e.processing_status='REJECTED' and e.rejection_reason='UNKNOWN_QUEST' and e.entity_type='VERIFIED_EVENT'
  and (e.entity_id ~ '^daily:[0-9]{4}-[0-9]{2}-[0-9]{2}:g1_[a-z0-9_]+_(easy|normal|hard)$'
    or e.entity_id ~ '^progression:[A-Za-z0-9._:-]+:(weekly:[0-9]{4}-W[0-9]{2}:weekly_(quest_master|daily_consistency|pathfinder|streak_keeper)|milestone:(3|7|14|30))$')
  and not exists(select 1 from public.reward_ledger l where l.user_id=e.user_id and l.evidence_event_key=e.event_key);

create or replace function public.submit_sync_event(
  p_event_key text,p_entity_type text,p_entity_id text default null,p_payload jsonb default '{}',
  p_device_install_id text default null,p_client_created_at timestamptz default null,p_schema_version integer default 1
) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); event_id uuid; body jsonb;
begin
  if u is null then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
  if p_event_key is null or p_event_key !~ '^[A-Za-z0-9._:-]{1,180}$' then raise exception 'INVALID_EVENT_KEY'; end if;
  if p_entity_type is null or p_entity_type !~ '^[A-Za-z0-9._:-]{1,100}$' then raise exception 'INVALID_ENTITY_TYPE'; end if;
  if p_schema_version is null or p_schema_version not between 1 and 999 then raise exception 'INVALID_SCHEMA_VERSION'; end if;
  if octet_length(coalesce(p_payload,'{}')::text)>16384 then raise exception 'PAYLOAD_TOO_LARGE'; end if;
  if p_payload::text ~* '"(lat|lng|latitude|longitude|route|gps|photo|image)"[[:space:]]*:' then raise exception 'SENSITIVE_FIELD_REJECTED'; end if;
  -- Keep aggregate evidence only. Client rewards and arbitrary nested metadata
  -- are never persisted or forwarded to the authoritative reward calculation.
  body := p_payload;
  if jsonb_typeof(p_payload)='object' then
    body := jsonb_strip_nulls(jsonb_build_object('quest_id',p_payload->'quest_id',
      'verification_type',p_payload->'verification_type','verification_score',p_payload->'verification_score',
      'distance_meters',p_payload->'distance_meters','duration_seconds',p_payload->'duration_seconds','completed_day',p_payload->'completed_day','user_id',p_payload->'user_id'));
    if p_payload ? 'activity' then body := body || jsonb_build_object('activity',jsonb_build_object(
      'expected',p_payload#>'{activity,expected}','detected',p_payload#>'{activity,detected}','verdict',p_payload#>'{activity,verdict}')); end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,41901));
  insert into public.sync_events(user_id,event_key,entity_type,entity_id,payload,device_install_id,client_created_at,schema_version)
    values(u,p_event_key,p_entity_type,left(p_entity_id,180),coalesce(body,'null'::jsonb),left(p_device_install_id,180),p_client_created_at,p_schema_version)
    on conflict(user_id,event_key) do nothing returning id into event_id;
  if event_id is null then select id into event_id from public.sync_events where user_id=u and event_key=p_event_key; end if;
  perform private.process_verified_sync_event(event_id,u);
  return event_id;
end;
$$;
