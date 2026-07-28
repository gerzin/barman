import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Utility function to merge Tailwind CSS class names with clsx and tailwind-merge
 * 
 * This function takes any number of class name inputs and merges them into a single string,
 * ensuring that Tailwind CSS classes are combined correctly without duplicates or conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
