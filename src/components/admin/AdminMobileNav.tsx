/**
 * Admin Mobile Navigation
 * Hamburger menu with slide-out drawer for mobile devices
 * Follows mobile-first pattern like partner portal
 */

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminSidebarNav } from "./AdminSidebarNav";

export const AdminMobileNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Slide-out Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 pb-3 border-b">
            <SheetTitle>Admin Menu</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <AdminSidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

