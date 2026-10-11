#!/usr/bin/env bash
# Sets HumHub mail to "No Delivery (Debug Mode, Save as file)" so no invitation or
# notification email can leave the pilot. Same as Administration > Settings >
# Advanced > E-Mail > Mail Transport Type. Re-run after any restore.
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
yii settings/set base mailerTransportType file
yii settings/list-module base | grep -i mailerTransportType
