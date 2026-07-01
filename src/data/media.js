// Edit this file to add your own get-togethers.
//
// Photos:
//   - Drop image files into  public/media/photos/
//   - Reference them here as "/media/photos/yourfile.jpg"
//
// Videos: (recommended — keeps your repo small and your site fast)
//   - Upload the video to YouTube (set visibility to "Unlisted" if you
//     don't want it publicly searchable)
//   - Grab the video ID from the URL, e.g.
//     https://youtube.com/watch?v=XXXXXXXXXXX  ->  id is "XXXXXXXXXXX"
//
// Each event becomes its own section on the page, in the order listed below.

const media = [
  {
    id: "diwali-2025",
    title: "Diwali Get-Together",
    date: "Nov 2025",
    note: "Sweets, lights and way too many selfies.",
    photos: [
      { src: "/media/photos/diwali-01.jpg", caption: "The whole team, finally in one frame" },
      { src: "/media/photos/diwali-02.jpg", caption: "Rangoli competition in full swing" },
      { src: "/media/photos/diwali-03.jpg", caption: "Someone brought way too many laddoos" },
    ],
    videos: [
      { youtubeId: "dQw4w9WgXcQ", caption: "The dance-off, captured for posterity" },
    ],
  },
  {
    id: "summer-outing-2025",
    title: "Summer Team Outing",
    date: "Jun 2025",
    note: "One day away from our desks.",
    photos: [
      { src: "/media/photos/summer-01.jpg", caption: "Lunch break by the lake" },
      { src: "/media/photos/summer-02.jpg", caption: "Tug of war: Engineering vs. Everyone Else" },
    ],
    videos: [],
  },
];

export default media;
