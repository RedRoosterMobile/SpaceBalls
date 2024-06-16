import { writable } from 'svelte/store';

// Create a writable store to hold the array of objects
export const itemsStore = writable([]);
