import React from "react";
import { ModeToggle } from "../ui/mode-toggle";

const Navbar = () => {
    return (
        <div className=" flex w-full justify-between px-4 pt-4 ">
            <div></div>
            <ModeToggle />
        </div>
    );
};

export default Navbar;
