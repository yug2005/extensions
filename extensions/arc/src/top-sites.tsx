import { Action, ActionPanel, Detail, Icon, List, showToast, Toast } from "@raycast/api";
import { getFavicon } from "@raycast/utils";
import { useState } from "react";
import { OpenInLittleArc, OpenInNewWindow, OpenInOtherBrowserAction } from "./actions";
import { topSitesPath, getTopSites, useSQL } from "./utils/sql";
import { TopSite } from "./types/types";
import { getDomain, isPermissionError } from "./utils/utils";

export default function Command() {
  const [searchText, setSearchText] = useState<string>();
  const { data, isLoading, error } = useSQL<TopSite>(topSitesPath, getTopSites(searchText));

  if (error) {
    if (isPermissionError(error)) {
      return <PermissionError />;
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Cannot search history",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <List searchBarPlaceholder="Top Sites" isLoading={isLoading} onSearchTextChange={setSearchText}>
      <List.EmptyView title="Not Found" />
      {data?.map((entry: TopSite, index: number) => (
        <List.Item
          key={index}
          icon={getFavicon(entry.url)}
          title={entry.title}
          subtitle={getDomain(entry.url)}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action.OpenInBrowser url={entry.url} />
                <OpenInLittleArc url={entry.url} />
                <OpenInNewWindow url={entry.url} />
              </ActionPanel.Section>
              <ActionPanel.Section>
                <OpenInOtherBrowserAction url={entry.url} />
              </ActionPanel.Section>
              <ActionPanel.Section>
                <Action.CopyToClipboard
                  title="Copy Page URL"
                  content={entry.url}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                />
                <Action.CopyToClipboard
                  title="Copy Page Title"
                  content={entry.title}
                  shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
                />
                <Action.CopyToClipboard
                  title="Copy URL as Markdown"
                  content={`[${entry.title}](${entry.url})`}
                  shortcut={{ modifiers: ["cmd", "opt", "shift"], key: "c" }}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function PermissionError() {
  const markdown = `## Raycast needs full disk access in order to display your Safari bookmarks.

  ![Full Disk Access Preferences Pane](https://i.imgur.com/3SAUwrx.png)
  
  1. Open the **Security & Privacy** Preferences pane and select the **Privacy** tab
  2. Select **Full Disk Access** from the list of services
  3. Click the lock icon in the bottom left corner to unlock the interface
  4. Enter your macOS administrator password
  5. Drag and Drop the icon for the **Raycast** application into the list as seen above`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.Open
            title="Open System Preferences"
            icon={Icon.Gear}
            target="x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"
          />
        </ActionPanel>
      }
    />
  );
}
