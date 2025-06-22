import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from './RootLayoutClient';

export const metadata: Metadata = {
  title: "Alaqmar School",
  description: "نظام إدارة المدرسة",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayoutClient>
      {children}
    </RootLayoutClient>
  );
}
