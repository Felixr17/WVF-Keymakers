#!/usr/bin/env bash
# Makes the community invitation-only: no self-registration, no guest access, and no
# member-to-member invitations. Uses the same setting keys that Administration >
# Users > Settings saves (AuthenticationSettingsForm, HumHub 1.18.6). Idempotent.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

yii settings/set user auth.anonymousRegistration 0 >/dev/null
yii settings/set user auth.allowGuestAccess 0 >/dev/null
yii settings/set user auth.internalUsersCanInviteByEmail 0 >/dev/null
yii settings/set user auth.internalUsersCanInviteByLink 0 >/dev/null
yii settings/set user auth.needApproval 1 >/dev/null
yii cache/flush-all >/dev/null
yii settings/list-module user | grep -E "auth\.(anonymousRegistration|allowGuestAccess|internalUsersCanInvite|needApproval)"
echo "Still required in the admin UI: Administration > Spaces > Permissions > Member (and Moderator) > Invite users = Deny."
