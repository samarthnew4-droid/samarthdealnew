import DealsHomepage from "./_components/deals-homepage";
import { getPublishedProductPosts } from "./_lib/product-posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { posts, errorMessage } = await getPublishedProductPosts();

  return <DealsHomepage posts={posts} errorMessage={errorMessage} />;
}
