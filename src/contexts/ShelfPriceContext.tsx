"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ShelfPriceContextType {
  shelfPrice: number | null;
  setShelfPrice: (price: number | null) => void;
}

const ShelfPriceContext = createContext<ShelfPriceContextType | undefined>(
  undefined
);

export function ShelfPriceProvider({ children }: { children: ReactNode }) {
  const [shelfPrice, setShelfPrice] = useState<number | null>(null);

  return (
    <ShelfPriceContext.Provider value={{ shelfPrice, setShelfPrice }}>
      {children}
    </ShelfPriceContext.Provider>
  );
}

export function useShelfPrice() {
  const context = useContext(ShelfPriceContext);
  if (context === undefined) {
    throw new Error("useShelfPrice must be used within a ShelfPriceProvider");
  }
  return context;
}

