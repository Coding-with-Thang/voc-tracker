"use client"

import { useState } from 'react';
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    return (
        <header className="sticky top-0 w-full bg-white border-b-2 border-gray-200 z-[1000]">
            <div className="flex items-center h-16 justify-between">
                <div className="hidden md:flex items-center pl-5">
                    <Link href="/" className="flex flex-1 gap-2 font-bold text-2xl mx-2 lg:mx-4 text-nowrap">
                        VOC Tracker
                    </Link>
                </div>


                <nav className="flex items-center justify-end gap-6 mr-6 lg:mr-9">
                    <SignedIn>
                        <Link href="/dashboard" className="flex gap-1 items-center hover:underline">
                            Admin
                        </Link>

                        <div className="relative">
                            <UserButton
                                userProfileProps={{
                                    //appearance: {
                                    //  elements: {
                                    //    profileSection: {
                                    //      display: 'none',
                                    //    }
                                    //  },
                                    //}
                                }}
                                appearance={{
                                    elements: {
                                        userButtonPopoverFooter: {
                                            display: 'none',
                                        },
                                    },
                                }}
                            />
                            {/* <button
                onClick={toggleDropdown}
                className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full text-white font-bold hover:bg-blue-600 focus:outline-none"
              >
                {user.initials}
              </button> */}

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
                                    <ul className="py-2">
                                        <li>
                                            <Link
                                                href="/profile"
                                                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                                            >
                                                Profile
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/settings"
                                                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                                            >
                                                Settings
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/logout"
                                                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                                            >
                                                Log Out
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </SignedIn>

                    <SignedOut>
                        <Link href="sign-in" className="hover:underline">Sign In</Link>
                    </SignedOut>
                </nav>
            </div>
        </header>
    );
}

export default Header
