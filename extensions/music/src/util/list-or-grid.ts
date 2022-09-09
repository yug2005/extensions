import { List, Grid, getPreferenceValues, Image } from "@raycast/api";

import { Preferences, LayoutType } from "./models";

export const { gridColumns, mainLayout, albumsLayout, albumTracksLayout, playlistTracksLayout } =
  getPreferenceValues<Preferences>();

type ListOrGridProps = (List.Props | Grid.Props) & { layoutType: LayoutType };
export function ListOrGrid<T>(props: ListOrGridProps, context?: T) {
  return props.layoutType === LayoutType.List ? List(props, context) : Grid(props, context);
}

type ListOrGridItemProps = (List.Item.Props | Grid.Item.Props) & {
  title: string;
  subtitle?: string;
  layoutType: LayoutType;
  content: Image.ImageLike;
};
export function ListOrGridItem<T>(props: ListOrGridItemProps, context?: T) {
  return props.layoutType === LayoutType.List ? List.Item(props, context) : Grid.Item(props, context);
}

type ListOrGridSectionProps = (List.Section.Props | Grid.Section.Props) & { layoutType: LayoutType };
export function ListOrGridSection<T>(props: ListOrGridSectionProps, context?: T) {
  return props.layoutType === LayoutType.List ? List.Section(props, context) : Grid.Section(props, context);
}

type ListOrGridEmptyViewProps = (List.EmptyView.Props | Grid.EmptyView.Props) & { layoutType: LayoutType };
export function ListOrGridEmptyView<T>(props: ListOrGridEmptyViewProps, context?: T) {
  return props.layoutType === LayoutType.List ? List.EmptyView(props, context) : Grid.EmptyView(props, context);
}

type ListOrGridDropdownProps = (List.Dropdown.Props | Grid.Dropdown.Props) & { layoutType: LayoutType };
export function ListOrGridDropdown<T>(props: ListOrGridDropdownProps, context?: T) {
  return props.layoutType === LayoutType.List
    ? List.Dropdown(props as List.Dropdown.Props, context)
    : Grid.Dropdown(props as Grid.Dropdown.Props, context);
}

type ListOrGridDropdownSectionProps = (List.Dropdown.Section.Props | Grid.Dropdown.Section.Props) & {
  layoutType: LayoutType;
};
export function ListOrGridDropdownSection<T>(props: ListOrGridDropdownSectionProps, context?: T) {
  return props.layoutType === LayoutType.List
    ? List.Dropdown.Section(props, context)
    : Grid.Dropdown.Section(props, context);
}

type ListOrGridDropdownItemProps = (List.Dropdown.Item.Props | Grid.Dropdown.Item.Props) & { layoutType: LayoutType };
export function ListOrGridDropdownItem<T>(props: ListOrGridDropdownItemProps, context?: T) {
  return props.layoutType === LayoutType.List
    ? List.Dropdown.Item(props as List.Dropdown.Item.Props, context)
    : Grid.Dropdown.Item(props as Grid.Dropdown.Item.Props, context);
}
