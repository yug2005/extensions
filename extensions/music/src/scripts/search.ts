import { runScript } from "../util/apple-script";

export const searchAppleMusic = (searchTerm: string) =>
  runScript(`
set savedClipboard to the clipboard
set the clipboard to "${searchTerm}"
tell application "Music" to activate
set using to "Music"

set musicWindow to {"Music"}
set notShowing to true
set toLaunch to true

repeat while toLaunch
	if using is "Music" and application "Music" is running then set toLaunch to false
	delay 0.5
end repeat

tell application "System Events"
	set frontAppProcess to first application process whose frontmost is true
end tell
tell frontAppProcess
	if (count of windows) > 0 then
		set window_name to name of front window
		if window_name is in musicWindow then
			set notShowing to false
		end if
	end if
end tell
if notShowing is true then
	tell application "System Events" to keystroke "0" using command down
end if

delay 0.1
tell application "System Events"
	keystroke "f" using command down
	keystroke "a" using command down
	keystroke "v" using command down
	key code 36
end tell
delay 1
set the clipboard to savedClipboard
`);
