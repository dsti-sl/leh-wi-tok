export const tutorialsData = [
  {
    id: 1,
    title: 'Introduction',
    description: 'Learn your way around the basics of sign language',
    video: 'https://www.youtube.com/watch?v=0FcwzMq4iWg',
    thumbnail:
      'https://fastly.picsum.photos/id/314/200/300.jpg?hmac=JrR8RW6cKgMfQOxlavDFHrFShwcnB_nuYpi1FWAzsgU',
    category: 'Alphabet',
    level: 'Beginner',
    duration: '1:00:00',
    rating: 4.5,
    totalRatings: 100,
    totalStudents: 1000,
  },
];

export const getDummyLessons = async (size: number = 60) => {
  const levels = ['Beginner', 'Basic Elementary', 'Intermediate', 'Advanced'];
  const categories = [
    'Alphabet',
    'School',
    'Community',
    'Household',
    'Job',
    'General',
  ];
  const titles = {
    Beginner: [
      'Introduction to Sign Language',
      'Basic Signs for Communication',
      'Common Phrases',
      'Numbers and Counting',
      'Days of the Week',
    ],
    'Basic Elementary': [
      'Elementary Signs',
      'School Vocabulary',
      'Family Members',
      'Colors and Shapes',
      'Food and Drinks',
    ],
    Intermediate: [
      'Intermediate Signs',
      'Community Vocabulary',
      'Household Items',
      'Job-Related Signs',
      'Emergency Signs',
    ],
    Advanced: [
      'Advanced Signs',
      'Complex Sentences',
      'Medical Vocabulary',
      'Technical Terms',
      'Idiomatic Expressions',
    ],
  };

  const statuses = ['pending', 'started', 'completed'];

  const getRandomElement = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];
  const getRandomDuration = () => `${Math.floor(Math.random() * 18) + 3}:00`;

  const generateRandomTutorial = async (id: number) => {
    const level = getRandomElement(levels);
    const title = getRandomElement(titles[level as keyof typeof titles]);
    const category = title.includes('Introduction')
      ? 'General'
      : getRandomElement(categories);
    const status = getRandomElement(statuses);

    return {
      id,
      title,
      description: `Learn about ${title.toLowerCase()} in sign language.`,
      video: `https://www.youtube.com/watch?v=${Math.random().toString(36).substring(7)}`,
      thumbnail: `https://picsum.photos/200/300?random=${id}`,
      category,
      level,
      duration: getRandomDuration(),
      rating: (Math.random() * 5).toFixed(1),
      totalRatings: Math.floor(Math.random() * 1000),
      totalStudents: Math.floor(Math.random() * 10000),
      status,
    };
  };

  const tutorialsData = await Array.from({ length: size }, (_, i) =>
    generateRandomTutorial(i + 1),
  );

  return await Promise.all(tutorialsData);
};
