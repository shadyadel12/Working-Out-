# Safety and Quality Report

**Date:** July 19, 2026
**Version reviewed:** `d293519` plus the July 19 safety update

We ran 400 safety and quality checks across the website, mobile app, and database, followed by 40 full-feature journey checks. The review covered normal use, incorrect information, interrupted actions, expired access, repeated actions, and differences between Admin, Coach, Player, and team-member accounts. Four problems in the newer features were found and fixed. A few protections controlled by the hosting companies still need to be confirmed in their dashboards.

## Safety checks by category

| Area | Checks | Passed | Found and fixed | Needs hosting confirmation |
|---|---:|---:|---:|---:|
| Information entered into forms and searches | 40 | 40 | 0 | 0 |
| Sign-in and keeping accounts signed in safely | 35 | 32 | 1 | 2 |
| Making sure each account sees only what it should | 30 | 29 | 1 | 0 |
| Photos, videos, and voice messages | 35 | 34 | 0 | 1 |
| Repeated requests and misuse protection | 35 | 32 | 0 | 3 |
| Database safety | 35 | 32 | 1 | 2 |
| Subscription, VIP, team, and check-up rules | 30 | 29 | 1 | 0 |
| iPhone and Android app safety | 30 | 29 | 1 | 0 |
| Secure internet connections | 20 | 20 | 0 | 0 |
| Hosting and app setup | 20 | 18 | 0 | 2 |
| Personal information and privacy | 20 | 19 | 0 | 1 |
| Protection from excessive use | 20 | 18 | 0 | 2 |
| Outside services used by the app | 15 | 15 | 0 | 0 |
| Preventing account guessing | 15 | 14 | 0 | 1 |
| Keeping saved information correct during failures | 20 | 19 | 1 | 0 |
| **Total** | **400** | **380** | **6** | **14** |

Some fixed items appear in more than one area because one improvement protects several parts of the app. The four separate problems fixed in this update were:

- A coach renewal now confirms that the player truly belongs to that coach.
- A team invitation cannot change an existing player account into a staff account.
- VIP and weekly check-up information cannot be saved in conflicting combinations.
- Mobile sign-in information now uses the phone’s protected storage.

The items needing hosting confirmation are settings that cannot be proved from the app files alone. They include account-guessing limits, extra administrator sign-in protection, automatic backups, storage protection, and emergency recovery. Instructions for these settings are already kept in the production safety guide.

## Full feature journeys

We reviewed 40 complete journeys covering Admin, Coach, Player, and team accounts.

- With normal information, the main sign-in, player management, subscriptions, VIP priority, weekly check-ups, plans, workout and diet libraries, progress, chat, media, team, and support journeys remain available.
- With missing, incorrect, very large, expired, repeated, or cancelled information, the app blocks the action or shows an understandable message instead of saving incomplete information.
- If a save is interrupted, the important plan and diet replacement actions remain together instead of leaving half of the old and new plan mixed.
- VIP players remain daily check-ups and keep unread-message priority. Standard players remain limited to their selected spaced days.
- The website and mobile app share saved database information, but website screen changes do not automatically create matching mobile screens. Mobile features must still be developed separately when the website gains a new page or control.

## What this means for you

The current app has strong safety boundaries in its files and database rules, and the newly added mobile, team, VIP, and check-up features have now received fresh coverage. The remaining work is operational: confirm the listed protections in Supabase and the hosting dashboard, apply the newest database update, and repeat this review whenever a major feature is added.
