export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-semibold text-slate-900 mb-4">
            NexSupply
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Sourcing Intelligence OS for US SMB Retailers
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <a
              href="/products"
              className="block p-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-200"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Products
              </h2>
              <p className="text-slate-600">
                Manage product knowledge and sourcing intelligence
              </p>
            </a>
            
            <a
              href="/orders"
              className="block p-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-200"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Orders
              </h2>
              <p className="text-slate-600">
                Track and manage purchase orders
              </p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
