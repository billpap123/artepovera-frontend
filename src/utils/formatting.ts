// Helper function (place in utils file or at the top of your component file)
const formatCategoryName = (category: string | undefined): string => {
    if (!category) return ''; // Handle cases where category might be undefined
  
    // Replace underscores with spaces first
    const spacedName = category.replace(/_/g, ' ');
  
    // Capitalize only the very first character of the resulting string
    // and concatenate with the rest of the string (which will be lowercase
    // after the underscore replacement from snake_case).
    return spacedName.charAt(0).toUpperCase() + spacedName.slice(1);
  };