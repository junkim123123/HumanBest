import HomeDeck from "@/components/home/HomeDeck"
import { loadProductManifest } from "@/lib/productManifest"

export default function HomePage() {
  const products = loadProductManifest();
  
  return (
    <main className="bg-white">
      <HomeDeck products={products} />
    </main>
  )
}
