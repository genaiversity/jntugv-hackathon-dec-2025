import React from 'react';

interface ProfileButtonProps {
  name: string;
  onClick: () => void;
  className?: string;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({ name, onClick, className = '' }) => {
  const getInitials = (fullName: string) => {
    // Split the name into words
    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 0) return '';
    
    // Get the first name
    const firstName = parts[0];
    
    // Logic: First letter of the first name
    const firstLetter = firstName.charAt(0);
    
    // If there's only one name, return first two letters or just one
    if (parts.length === 1) {
      return firstName.substring(0, 2).toUpperCase();
    }

    // Get the last name (last word in the array)
    const lastName = parts[parts.length - 1];
    
    // Logic: First letter of the last name (Standard Initials)
    // Note: If the requirement was strictly "last letter of last name", 
    // it would be lastName.slice(-1). Assuming standard profile convention here.
    const lastNameLetter = lastName.charAt(0);
    
    return (firstLetter + lastNameLetter).toUpperCase();
  };

  return (
    <button 
      onClick={onClick}
      className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity ml-1 ${className}`}
      title={name}
    >
      {getInitials(name)}
    </button>
  );
};