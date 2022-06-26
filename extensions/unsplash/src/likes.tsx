import { Grid } from "@raycast/api";
import { getGridItemSize, showImageTitle } from "./functions/gridItemSize"

// Hooks
import { useLikes } from "./hooks/useLikes";

// Components
import Actions from "./components/Actions";

// Types
interface SearchListItemProps {
  item: LikesResult;
}

const Unsplash: React.FC = () => {
  const { loading, likes } = useLikes();

  return (
    <Grid isLoading={loading} itemSize={getGridItemSize()} searchBarPlaceholder="Search your likes...">
      <Grid.Section title="Results" subtitle={String(likes?.length)}>
        {likes?.map((like) => (
          <SearchListItem key={like.id} item={like} />
        ))}
      </Grid.Section>
    </Grid>
  );
};

const SearchListItem: React.FC<SearchListItemProps> = ({ item }) => {
  const [title, image, avatar] = [
    item.title || item.description || item.user.name || "No Name",
    item.urls?.thumb || item.urls?.small || item.urls?.regular,
    item.user?.profile_image?.small,
  ];

  const mimicItem: SearchResult = {
    ...item,
    title,
    alt_description: "",
  };

  return (
    <Grid.Item content={image} title={showImageTitle() ? title : ""} actions={<Actions item={mimicItem} details />} />
  );
};

export default Unsplash;
