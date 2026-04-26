const fs = require("fs");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Exclude draft pages from build output entirely
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {
      if (data.draft) return false;
      return data.permalink;
    },
    eleventyExcludeFromCollections: (data) => {
      if (data.draft) return true;
      return data.eleventyExcludeFromCollections;
    }
  });

  // Format date as "Month Year"
  eleventyConfig.addFilter("displayDate", function(date) {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  // Add filter to check if event is upcoming
  eleventyConfig.addFilter("isUpcoming", function(eventDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    return event >= today;
  });

  // Collections
  eleventyConfig.addCollection("allEvents", (collection) => {
    return collection.getFilteredByGlob("src/events/**/*.md")
      .filter(item => !item.data.draft)
      .sort((a,b)=> (b.date - a.date)); // Sort all events reverse chronologically
  });

  eleventyConfig.addCollection("recentEvents", (collection) => {
    return collection.getFilteredByGlob("src/projects/**/*.md")
      .filter(item => !item.data.draft)
      .sort((a, b) => {
        const aMtime = fs.statSync(a.inputPath).mtime;
        const bMtime = fs.statSync(b.inputPath).mtime;
        return bMtime - aMtime; // Sort by file modification time, most recent first
      });
  });

  eleventyConfig.addCollection("aboutContent", (collection) => {
    return collection.getFilteredByGlob("src/about/about.md");
  });

  eleventyConfig.addCollection("allWorkshops", (collection) => {
    return collection.getFilteredByGlob("src/workshops/**/*.md")
      .filter(item => !item.data.draft) // Exclude drafts
      .sort((a,b)=> (a.data.title.localeCompare(b.data.title))); // Sort workshops alphabetically by title
  });

  eleventyConfig.addCollection("allFoundations", (collection) => {
    return collection.getFilteredByGlob("src/foundations/**/*.md")
      .filter(item => !item.data.draft)
      .filter(item => !item.data.archived) // Exclude archived foundations
      .sort((a,b)=> (a.data.title.localeCompare(b.data.title))); // Sort foundations alphabetically by title
  });

  // Journal collection - sorted by date, newest first
  eleventyConfig.addCollection("journal", (collection) => {
    return collection.getFilteredByTag("journal")
      .sort((a, b) => b.date - a.date);
  });

  // Recent journal posts for homepage (last 3)
  eleventyConfig.addCollection("recentJournal", (collection) => {
    return collection.getFilteredByTag("journal")
      .sort((a, b) => b.date - a.date)
      .slice(0, 3);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};