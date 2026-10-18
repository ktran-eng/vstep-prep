import type { WritingPromptInput } from "@/domain/content-schema";

const LETTER_TIME = 20;
const ESSAY_TIME = 40;

export const writingPrompts: WritingPromptInput[] = [
  /* ---------------------------- Mock letters ---------------------------- */
  {
    id: "wr-m1-letter-job",
    task: "letter",
    level: "B1",
    title: "Advice about a part-time job",
    topic: "Work & study",
    instructions:
      "You received an email from your English-speaking friend, Lan. Read part of the email below and write a reply. You should write at least 120 words. Do not include your name or addresses.",
    stimulus: `"…I've just been offered two part-time jobs for the summer: one at a café near my house, and one as an assistant at an English centre, which pays a bit less but is further away. I really need the money for next year, but I also want to improve my English. Which one do you think I should take? And how can I make sure the job doesn't affect my studies when term starts again?…"`,
    requiredPoints: ["Respond to Lan's news", "Recommend one job and give reasons", "Suggest how to balance the job and studying", "Close the email appropriately"],
    minWords: 120,
    suggestedMinutes: LETTER_TIME,
    sample: {
      level: "B2",
      text: `Dear Lan,

Congratulations on getting two job offers! That shows how hard you have been working, and I'm really happy for you.

If I were you, I would take the job at the English centre. I know the café pays a little more, but working with teachers and students every day would give you plenty of chances to practise English, which is exactly what you want. It could also look good on your CV when you apply for jobs after graduation. The longer journey is a disadvantage, but you could use the time on the bus to listen to podcasts or review vocabulary.

When term starts again, I suggest you ask the centre if you can work only at weekends or two evenings a week. It would also help to plan your study time carefully at the beginning of each week, so that assignments don't pile up.

Let me know what you decide. Good luck!

Best wishes,`,
    },
  },
  {
    id: "wr-m2-letter-hotel",
    task: "letter",
    level: "B2",
    title: "Complaint to a hotel manager",
    topic: "Travel & services",
    instructions:
      "You recently stayed at the Sea View Hotel in Nha Trang for three nights, but you were not satisfied with your stay. Write an email to the hotel manager. You should write at least 120 words. Do not include your name or addresses.",
    stimulus: `Problems during your stay:
• The room you had booked online (sea view) was not available.
• The air conditioner did not work properly for two nights.
• Breakfast, which was advertised as included, was charged on your bill.`,
    requiredPoints: ["State the purpose of the email and the dates of your stay", "Describe the problems clearly", "Explain how they affected you", "Say what action you expect the hotel to take", "Use a formal register"],
    minWords: 120,
    suggestedMinutes: LETTER_TIME,
    sample: {
      level: "B2",
      text: `Dear Sir or Madam,

I am writing to complain about my recent stay at the Sea View Hotel from 12 to 15 June.

Firstly, although I had booked and paid for a room with a sea view, I was told on arrival that no such room was available, and I was given a room overlooking the car park. Secondly, the air conditioner in that room did not work properly for two of the three nights. Despite reporting the problem to reception twice, nobody came to repair it, and as a result I slept very badly. Finally, when I checked out, I discovered that I had been charged for breakfast, even though your website clearly states that breakfast is included in the room rate.

I would therefore be grateful if you could refund the breakfast charges and the difference between the two room types. I look forward to receiving your reply within the next two weeks.

Yours faithfully,`,
    },
  },
  {
    id: "wr-m3-letter-visit",
    task: "letter",
    level: "B2",
    title: "Advice for a visiting colleague",
    topic: "Travel & culture",
    instructions:
      "You received an email from Mark, an English-speaking colleague who will visit your city for a conference. Read part of his email and write a reply. You should write at least 120 words. Do not include your name or addresses.",
    stimulus: `"…The conference finishes on Friday, so I'll have the weekend free before my flight home on Sunday evening. What would you recommend I see or do? Also, what's the best way to get around the city, and is there any local food I really shouldn't miss?…"`,
    requiredPoints: ["Respond warmly to Mark", "Recommend places or activities for the weekend", "Advise on transport", "Recommend local food", "Offer to meet or help"],
    minWords: 120,
    suggestedMinutes: LETTER_TIME,
    sample: {
      level: "B2",
      text: `Hi Mark,

It's great to hear you're coming, and I'm glad you'll have some free time after the conference.

On Saturday morning, I'd recommend visiting the Old Quarter before it gets too hot. You can wander through the narrow streets, each of which used to specialise in a different trade, and then walk around Hoan Kiem Lake. In the afternoon, the Temple of Literature is well worth a visit if you're interested in history.

The easiest way to get around is by ride-hailing app, as it's cheap and you don't need to negotiate prices. Walking is also pleasant in the centre, but be careful when crossing the road!

As for food, you really shouldn't miss bun cha, grilled pork with noodles, which is best at lunchtime. Egg coffee is another local speciality.

If you like, I could take you to my favourite bun cha place on Saturday. Just let me know.

Best,`,
    },
  },
  /* ---------------------------- Mock essays ---------------------------- */
  {
    id: "wr-m1-essay-tuition",
    task: "essay",
    level: "B2",
    title: "Should university education be free?",
    topic: "Education",
    instructions:
      "Write an essay of at least 250 words on the following topic. Use reasons and specific examples to support your answer.",
    stimulus: "Some people believe that university education should be free for all students. Others think that students should pay tuition fees because they benefit personally from their degree. Discuss both views and give your own opinion.",
    requiredPoints: ["Discuss the view that university should be free", "Discuss the view that students should pay", "Give and justify a clear personal opinion", "Support ideas with reasons and examples"],
    minWords: 250,
    suggestedMinutes: ESSAY_TIME,
    sample: {
      level: "B2",
      text: `Whether higher education should be paid for by the state or by students themselves is a long-standing debate. While there are reasonable arguments on both sides, I believe that university should be free, or nearly free, for students who cannot afford it.

Those who support free university education argue that it creates equal opportunities. Talented young people from poor families are often discouraged by high fees, so the country loses doctors, engineers and teachers it badly needs. In addition, society as a whole benefits from a more educated workforce, because graduates tend to earn more, pay more tax and contribute to economic growth. From this point of view, funding universities is an investment rather than a cost.

On the other hand, many people believe that students should pay because they are the main beneficiaries of their degree. A graduate usually earns considerably more than someone without one, so it seems fair that they should contribute. Furthermore, free education is extremely expensive for governments, and the money might be better spent on primary schools or hospitals. Some also argue that students who pay are more motivated and less likely to waste their time.

In my opinion, the best solution lies between these two positions. Universities should be free for students from low-income families, while others could pay fees through loans that are repaid only once they earn a certain salary. This system would protect equal access without placing the entire burden on taxpayers.

In conclusion, although graduates do benefit personally from their education, I believe that no capable student should be prevented from studying because of money.`,
    },
  },
  {
    id: "wr-m2-essay-socialmedia",
    task: "essay",
    level: "B2",
    title: "Social media: advantages and disadvantages",
    topic: "Technology & society",
    instructions:
      "Write an essay of at least 250 words on the following topic. Use reasons and specific examples to support your answer.",
    stimulus: "People today, especially young people, spend more and more time on social media. Do the advantages of this trend outweigh the disadvantages?",
    requiredPoints: ["Discuss advantages of spending time on social media", "Discuss disadvantages", "State clearly whether advantages outweigh disadvantages", "Support ideas with reasons and examples"],
    minWords: 250,
    suggestedMinutes: ESSAY_TIME,
    sample: {
      level: "B2",
      text: `Over the past decade, social media has become a central part of daily life, particularly for young people, many of whom spend several hours a day on platforms such as Facebook and TikTok. Although this trend has some clear benefits, I believe its disadvantages are more significant.

There is no doubt that social media offers advantages. First, it allows people to stay in touch with friends and relatives who live far away, which was much more difficult and expensive in the past. Second, it can be a valuable source of information and learning. For example, many students follow channels that explain grammar or science in an entertaining way. Finally, social media has created new job opportunities for content creators and small online businesses.

However, spending too much time on these platforms causes serious problems. The most worrying is the effect on mental health. Constantly comparing themselves with the carefully edited lives of others can make young people feel anxious or dissatisfied. Moreover, endless scrolling reduces the time available for sleep, exercise and face-to-face conversation. Another concern is misinformation: false stories often spread faster than accurate ones, and young users may not have the skills to tell the difference.

In my view, the disadvantages outweigh the advantages, not because social media is harmful in itself, but because the amount of time people spend on it is excessive. Its benefits can be enjoyed in thirty minutes a day, while most of the harm comes from the hours that follow.

To conclude, social media is a useful tool, but young people need to learn to control their use of it rather than letting it control them.`,
    },
  },
  {
    id: "wr-m3-essay-migration",
    task: "essay",
    level: "C1",
    title: "Rural-to-urban migration",
    topic: "Society",
    instructions:
      "Write an essay of at least 250 words on the following topic. Use reasons and specific examples to support your answer.",
    stimulus: "In many countries, including Vietnam, large numbers of young people are moving from rural areas to big cities. What are the main causes of this trend, what problems does it create, and what can be done to address them?",
    requiredPoints: ["Explain the causes of migration to cities", "Describe problems for cities and/or rural areas", "Propose realistic solutions", "Support ideas with reasons and examples"],
    minWords: 250,
    suggestedMinutes: ESSAY_TIME,
    sample: {
      level: "C1",
      text: `Over the past three decades, cities such as Hanoi and Ho Chi Minh City have grown at an extraordinary rate, largely because of an influx of young people from the countryside. This movement reflects powerful economic forces, but it also places considerable strain on both the cities that receive migrants and the villages they leave behind.

The principal cause is the gap in opportunities. Industrial zones and service industries are concentrated in urban areas, where wages are typically several times higher than those available from farming. Education is a further factor: universities and specialised training are found almost exclusively in large cities, and many students who move to study never return. Finally, city life holds a cultural appeal for the young, offering a degree of independence and variety that small communities cannot match.

The consequences are felt in two places. In the cities, rapid population growth has outpaced investment in housing and infrastructure, resulting in overcrowded rental rooms, traffic congestion and pressure on schools and hospitals. Meanwhile, many rural communities are left with an ageing population, as the working-age generation departs and children are often raised by grandparents.

Addressing these problems requires action on both fronts. Governments could encourage investment outside the major cities, for instance through tax incentives for factories in provincial towns, so that well-paid work becomes available closer to home. Improving rural schools and internet access would also reduce the pressure to move. At the same time, cities need to plan for growth by building affordable housing and expanding public transport rather than reacting to problems after they arise.

In conclusion, migration to cities is an understandable response to unequal opportunity. Its negative effects can be reduced, but only if development is spread more evenly across the country.`,
    },
  },
  /* -------------------------- Practice letters -------------------------- */
  {
    id: "wr-p-b1-letter-party",
    task: "letter",
    level: "B1",
    title: "Reply to a birthday invitation",
    topic: "Friends & social life",
    instructions: "Your English-speaking friend, Tom, has invited you to his birthday party. Read part of his email and write a reply. You should write at least 120 words.",
    stimulus: `"…I'm having a small party at my flat next Saturday evening to celebrate my 20th birthday. Can you come? Also, could you help me choose some music and food? I want everyone to have a good time!…"`,
    requiredPoints: ["Thank Tom and accept or decline the invitation", "Suggest music", "Suggest food", "Offer some help"],
    minWords: 120,
    suggestedMinutes: LETTER_TIME,
    sample: {
      level: "B1",
      text: `Hi Tom,

Thanks so much for inviting me to your birthday party! I'd love to come, and I'm really looking forward to it.

About the music, I think you should make a playlist with a mix of pop songs that everyone knows and some dance music for later in the evening. People usually enjoy singing along to songs they recognise, so maybe you could add a few old hits too.

For food, I suggest you keep it simple. Pizza and spring rolls are always popular, and they are easy to eat while standing and chatting. You could also prepare a big bowl of fruit for people who want something healthier. Don't forget the birthday cake!

If you like, I can come early on Saturday afternoon to help you decorate the flat and set up the food.

See you soon,`,
    },
  },
  {
    id: "wr-p-b2-letter-park",
    task: "letter",
    level: "B2",
    title: "Letter to the local council about a park",
    topic: "Community",
    instructions: "The park near your home has become dirty and unsafe. Write a letter to the local council. You should write at least 120 words. Do not include your name or addresses.",
    stimulus: `In your letter:
• describe the current condition of the park
• explain why the park is important to local residents
• suggest what the council should do`,
    requiredPoints: ["Describe the condition of the park", "Explain why the park matters to residents", "Suggest specific actions", "Use a formal register"],
    minWords: 120,
    suggestedMinutes: LETTER_TIME,
    sample: {
      level: "B2",
      text: `Dear Sir or Madam,

I am writing to draw your attention to the condition of Hoa Binh Park, which is located next to my apartment building.

Over the past six months, the park has become increasingly neglected. Rubbish bins are rarely emptied, so litter is scattered across the grass, and several of the lights along the main path no longer work. As a result, many residents, especially elderly people and parents with young children, no longer feel safe walking there after dark.

This is a great pity, because the park is the only green space in our neighbourhood. It is where older residents exercise in the early morning and where children play after school.

I would therefore like to request that the council arrange for the bins to be emptied more frequently and repair the broken lights as soon as possible. It might also be worth installing a few signs to discourage littering.

I look forward to hearing from you.

Yours faithfully,`,
    },
  },
  {
    id: "wr-p-c1-letter-volunteer",
    task: "letter",
    level: "C1",
    title: "Application to volunteer at an international conference",
    topic: "Work",
    instructions:
      "You have seen an advertisement for volunteers at an international education conference in your city. Write an email to the organisers applying for a position. You should write at least 120 words. Do not include your name or addresses.",
    stimulus: `"VOLUNTEERS WANTED – International Education Forum, 3 days. We are looking for volunteers to welcome delegates, help at the registration desk and assist speakers. Tell us why you are interested, what relevant skills or experience you have, and which days you are available."`,
    requiredPoints: ["State which position you are applying for", "Explain your motivation", "Describe relevant skills and experience", "State your availability", "Use a formal, persuasive register"],
    minWords: 120,
    suggestedMinutes: LETTER_TIME,
    sample: {
      level: "C1",
      text: `Dear Organising Committee,

I am writing in response to your advertisement for volunteers at the International Education Forum, and I would like to apply to assist with welcoming delegates and staffing the registration desk.

As a final-year student of English language teaching, I have a strong personal interest in the themes of the forum, and the opportunity to hear leading researchers discuss current issues in education would be invaluable to me. I am also keen to contribute to an event that brings international visitors to our city.

I believe my experience makes me well suited to the role. Last year I worked as a student ambassador at my university's open days, where I guided visitors, answered questions and dealt calmly with last-minute changes. I am confident communicating in English and comfortable using registration software.

I am available on all three days of the forum and would be happy to attend any training session beforehand.

Thank you for considering my application. I look forward to hearing from you.

Yours faithfully,`,
    },
  },
  /* -------------------------- Practice essays -------------------------- */
  {
    id: "wr-p-b1-essay-city",
    task: "essay",
    level: "B1",
    title: "City or countryside?",
    topic: "Lifestyle",
    instructions: "Write an essay of at least 250 words on the following topic. Use reasons and specific examples to support your answer.",
    stimulus: "Some people prefer to live in a big city, while others prefer to live in the countryside. Which do you prefer, and why?",
    requiredPoints: ["State a clear preference", "Give at least two reasons with examples", "Mention the other side briefly", "Write a conclusion"],
    minWords: 250,
    suggestedMinutes: ESSAY_TIME,
    sample: {
      level: "B1",
      text: `Where to live is an important decision that affects many parts of our lives. Some people love the excitement of big cities, while others enjoy the peace of the countryside. In my opinion, living in a big city is the better choice, especially for young people.

The first reason is that cities offer more opportunities for study and work. Most good universities and large companies are in big cities such as Hanoi or Ho Chi Minh City. For example, my cousin moved to Hanoi after finishing high school, and now she studies at a famous university and has a part-time job in an office. This would be very difficult if she still lived in our village.

The second reason is convenience. In a city, you can find almost everything you need near your home: supermarkets, hospitals, cinemas and restaurants. If you get sick at night, you can go to a hospital quickly. In addition, there are many interesting things to do at the weekend, such as visiting museums or going to concerts.

Of course, life in the countryside also has advantages. The air is cleaner, the streets are quieter, and the cost of living is lower. Many people feel less stressed there, and they can enjoy fresh food from their own gardens. However, I think these benefits are more important for older people who want a quiet life.

In conclusion, although the countryside is peaceful and healthy, I prefer to live in a big city because it gives me more chances to study, work and enjoy my free time. Maybe when I am older, I will move to the countryside.`,
    },
  },
  {
    id: "wr-p-b2-essay-uniforms",
    task: "essay",
    level: "B2",
    title: "School uniforms",
    topic: "Education",
    instructions: "Write an essay of at least 250 words on the following topic. Use reasons and specific examples to support your answer.",
    stimulus: "All secondary school students should be required to wear a school uniform. To what extent do you agree or disagree?",
    requiredPoints: ["State the extent of your agreement", "Support your view with reasons and examples", "Acknowledge an opposing argument", "Write a conclusion that matches your position"],
    minWords: 250,
    suggestedMinutes: ESSAY_TIME,
    sample: {
      level: "B2",
      text: `In Vietnam, as in many other countries, most secondary schools require students to wear a uniform. Some people believe that this rule limits young people's freedom, but I largely agree that uniforms should be compulsory, although schools should allow some flexibility.

The main argument in favour of uniforms is that they reduce differences between rich and poor students. When everyone wears the same clothes, there is less pressure to buy expensive brands, and students are less likely to be judged by what they wear. This can reduce bullying and help create a sense of equality. Furthermore, uniforms are often cheaper in the long run, because parents do not need to buy a large number of fashionable clothes for school.

Another advantage is that uniforms help students focus on learning. Getting dressed in the morning becomes quick and simple, and the uniform signals that school is a place for study. Many teachers also believe that uniforms improve discipline and give students a sense of belonging to their school community.

On the other hand, critics argue that uniforms prevent teenagers from expressing their personality, which is an important part of growing up. Some uniforms are also uncomfortable, especially in hot weather. These are reasonable concerns, but they can be addressed without abolishing uniforms altogether. For instance, schools could offer a choice of styles, use lighter materials in summer, or allow students to wear their own clothes on one day each week.

In conclusion, I believe the benefits of school uniforms, particularly in reducing inequality and improving focus, outweigh the disadvantages, provided that schools design them with students' comfort and individuality in mind.`,
    },
  },
  {
    id: "wr-p-c1-essay-transport",
    task: "essay",
    level: "C1",
    title: "Public transport versus roads",
    topic: "Cities & policy",
    instructions: "Write an essay of at least 250 words on the following topic. Use reasons and specific examples to support your answer.",
    stimulus: "Governments should spend money on public transport rather than on building new roads. To what extent do you agree or disagree?",
    requiredPoints: ["State a clear, nuanced position", "Develop arguments for public transport investment", "Evaluate the case for roads", "Use precise examples and a logical structure"],
    minWords: 250,
    suggestedMinutes: ESSAY_TIME,
    sample: {
      level: "C1",
      text: `As cities across Asia struggle with chronic congestion, governments face a recurring choice between widening roads and expanding public transport. While new roads are sometimes necessary, I strongly agree that, in large and growing cities, public transport should be the priority for investment.

The most compelling argument concerns efficiency. A single metro line can carry tens of thousands of passengers per hour in each direction, far more than any realistic number of road lanes. Moreover, experience in many cities suggests that new roads tend to fill up with traffic soon after they open, a phenomenon known as induced demand: when driving becomes easier, more people choose to drive. Building roads alone therefore rarely solves congestion for long.

Public transport also brings broader benefits. It reduces air pollution and carbon emissions, which are serious health concerns in cities such as Hanoi, and it gives people who cannot afford a car or motorbike reliable access to jobs and education. Well-planned stations can also encourage denser, more walkable neighbourhoods, which makes services cheaper to provide.

That said, roads cannot be ignored. Rural areas, where populations are too dispersed for buses or trains to be viable, depend on them, and goods are still largely transported by truck. Buses themselves need decent roads. The real question is therefore one of balance rather than an absolute choice.

In conclusion, although road investment remains essential for freight and rural connectivity, the evidence suggests that money spent on public transport delivers greater and more lasting benefits in urban areas. Governments that continue to prioritise roads in their largest cities are likely to find that congestion simply returns.`,
    },
  },
];
