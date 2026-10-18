import type { SpeakingPromptInput } from "@/domain/content-schema";

// Timings are configurable defaults (unverified per-part split of the official 12 minutes; see docs/SPECIFICATION_RESEARCH.md).
const P1 = { preparationSeconds: 0, responseSeconds: 180 };
const P2 = { preparationSeconds: 60, responseSeconds: 120 };
const P3 = { preparationSeconds: 60, responseSeconds: 240 };

const P1_INSTR = "Part 1 – Social interaction. Answer the examiner's questions about the two topics below. Give full answers with reasons and examples. You have about 3 minutes.";
const P2_INSTR = "Part 2 – Solution discussion. Read the situation and the three suggested solutions. You have 1 minute to prepare. Then speak for up to 2 minutes: say which solution is best and explain why the other two are less suitable.";
const P3_INSTR = "Part 3 – Topic development. You have 1 minute to prepare. Then talk about the topic for about 2–3 minutes, using the ideas given and/or your own. Finally, answer the follow-up questions.";

export const speakingPrompts: SpeakingPromptInput[] = [
  /* ------------------------------ Mock 1 ------------------------------ */
  {
    id: "sp-m1-p1",
    level: "B1",
    title: "Your hometown · Free time",
    topic: "Personal life",
    instructions: P1_INSTR,
    content: {
      part: 1,
      topics: [
        { name: "Your hometown", questions: ["Where is your hometown?", "What do you like most about it?", "How has it changed in recent years?"] },
        { name: "Free time", questions: ["What do you usually do in your free time?", "Do you prefer spending free time alone or with others? Why?", "Do you think people today have less free time than in the past?"] },
      ],
    },
    ...P1,
    modelResponse:
      "My hometown is Nam Dinh, a small city about ninety kilometres south of Hanoi. What I like most about it is that it's peaceful and everything is close together, so you can cycle almost anywhere in fifteen minutes. It has changed quite a lot recently. There are more cafés and shopping centres, and the roads are busier than when I was a child, but it still feels friendly. In my free time, I usually play badminton with my friends or watch films. I prefer spending time with other people because I find it more relaxing to chat and laugh together, although sometimes I enjoy reading alone at night. I think people today do have less free time, mainly because work and study are more demanding, and we also spend a lot of time on our phones, which doesn't really feel like rest.",
    usefulLanguage: ["What I like most about it is…", "It has changed quite a lot in recent years.", "I'd rather… because…", "Compared with the past, …"],
  },
  {
    id: "sp-m1-p2",
    level: "B2",
    title: "Organising an end-of-year party",
    topic: "Social events",
    instructions: P2_INSTR,
    content: {
      part: 2,
      situation: "Your class is organising an end-of-year party, but students cannot agree on where to hold it. The budget is limited and about thirty students will attend.",
      options: ["Book a private room at a restaurant", "Have a picnic in a park", "Hold the party in a classroom at school"],
    },
    ...P2,
    modelResponse:
      "In my opinion, the best option is to have a picnic in a park. First of all, it's by far the cheapest choice, because we only need to pay for food and drinks, and everyone can bring something to share. Secondly, a park gives us plenty of space for thirty people, and we can play games outdoors, which would make the party more memorable than just sitting around a table. As for the restaurant, although it would be comfortable and we wouldn't have to prepare anything, a private room for thirty people would be quite expensive, and some students might not be able to afford their share. Holding the party in a classroom is free, but it doesn't really feel like a celebration, since we spend every day there. It might also be difficult to get permission to stay late. The only risk with a picnic is the weather, so we should check the forecast and choose a park with a covered area just in case.",
    usefulLanguage: ["In my opinion, the best option is… because…", "As for…, although…, …", "The main drawback of… is…", "Just in case…"],
  },
  {
    id: "sp-m1-p3",
    level: "B2",
    title: "Learning English through technology",
    topic: "Education & technology",
    instructions: P3_INSTR,
    content: {
      part: 3,
      topic: "Learning English through technology has more advantages than disadvantages.",
      ideas: ["convenience and flexibility", "low cost", "access to authentic materials", "(your own ideas)"],
      followUps: ["What are the disadvantages of learning English only through apps?", "Can technology replace teachers? Why or why not?", "How do you think language learning will change in the future?"],
    },
    ...P3,
    modelResponse:
      "I strongly agree that learning English through technology has more advantages than disadvantages. The first and most obvious advantage is convenience. With a smartphone, learners can study at any time and anywhere, for example on the bus or during a lunch break, which is very helpful for busy students and workers. Another advantage is cost. Many apps, websites and video channels are free or very cheap, while private classes can be expensive. Most importantly, technology gives learners access to authentic English. We can watch films, listen to podcasts and read news written for native speakers, so we learn how people really speak, not only textbook language. Of course, there are some disadvantages. It's easy to get distracted by social media, and apps can't always correct our speaking or writing properly. However, I think these problems can be reduced if learners set clear goals and combine technology with some classes. In answer to the follow-up questions, I don't think technology can completely replace teachers, because a good teacher motivates students and gives personal feedback. In the future, I expect AI tutors will become more common, but human interaction will still be important.",
    usefulLanguage: ["The first and most obvious advantage is…", "Most importantly, …", "Of course, there are some drawbacks.", "These problems can be reduced if…"],
  },
  /* ------------------------------ Mock 2 ------------------------------ */
  {
    id: "sp-m2-p1",
    level: "B1",
    title: "Food · Weather",
    topic: "Daily life",
    instructions: P1_INSTR,
    content: {
      part: 1,
      topics: [
        { name: "Food", questions: ["What kind of food do you enjoy most?", "Do you usually eat at home or eat out?", "Is it important for young people to learn to cook? Why?"] },
        { name: "Weather", questions: ["What's the weather like in your area at this time of year?", "What is your favourite season? Why?", "How does the weather affect your mood?"] },
      ],
    },
    ...P1,
    modelResponse:
      "I enjoy Vietnamese food the most, especially noodle soups like pho and bun bo Hue, because they're tasty and filling. On weekdays I usually eat at home because it's cheaper and healthier, but at weekends my family often eats out together. I think it's very important for young people to learn to cook, because when they move away to study or work, they need to look after themselves and not depend on fast food. At the moment the weather where I live is quite hot and humid, with short storms in the afternoon. My favourite season is autumn, because the air is cooler and drier, and it's pleasant to walk outside in the evening. The weather definitely affects my mood. When it's grey and rainy for several days, I feel a bit lazy, but on sunny days I have much more energy.",
    usefulLanguage: ["I'm a big fan of…", "On weekdays I usually…, but at weekends…", "It definitely affects…", "It depends on…"],
  },
  {
    id: "sp-m2-p2",
    level: "B2",
    title: "Helping a friend get healthier",
    topic: "Health",
    instructions: P2_INSTR,
    content: {
      part: 2,
      situation: "Your friend works in an office, feels tired all the time and wants to become healthier, but has very little free time.",
      options: ["Join a gym near the office", "Cycle to work instead of riding a motorbike", "Cook healthier meals at home"],
    },
    ...P2,
    modelResponse:
      "Considering that my friend has very little free time, I think the best solution is to cycle to work. The great thing about this option is that it combines exercise with something he already has to do every day, so it doesn't require any extra time. Cycling for twenty or thirty minutes each way would improve his fitness and probably help him sleep better, which might reduce his tiredness. It would also save money on fuel. Joining a gym is a good idea in theory, but in practice, if he's already busy and tired, he might pay for a membership and then rarely go, which happens to a lot of people. Cooking healthier meals at home is also beneficial, but it takes time to shop and prepare food, and on its own it wouldn't give him the exercise he needs. Of course, cycling in heavy traffic can be dangerous, so he should wear a helmet and choose quieter roads if possible.",
    usefulLanguage: ["Considering that…, I think…", "The great thing about this option is…", "…is a good idea in theory, but in practice…", "On its own, it wouldn't…"],
  },
  {
    id: "sp-m2-p3",
    level: "C1",
    title: "Tourism and local communities",
    topic: "Tourism",
    instructions: P3_INSTR,
    content: {
      part: 3,
      topic: "Tourism brings more benefits than problems to local communities.",
      ideas: ["jobs and income", "preservation of culture", "environmental damage", "(your own ideas)"],
      followUps: ["How can local people benefit more from tourism?", "Should popular destinations limit the number of visitors?", "Has tourism changed any place you know?"],
    },
    ...P3,
    modelResponse:
      "This is a complex issue, but on balance I'd argue that tourism brings more benefits than problems, provided it's managed carefully. The clearest benefit is economic. Tourism creates jobs not only in hotels and restaurants but also for drivers, guides and craftspeople, and in remote areas such as Sa Pa it may be one of the few sources of cash income. Tourism can also help preserve culture. When visitors are willing to pay for traditional music, festivals or handicrafts, younger people have a reason to keep these traditions alive rather than abandon them. That said, the problems are real. Mass tourism can damage fragile environments, as we've seen with coral reefs and overcrowded beaches, and it can push up property prices so that local families can no longer afford to live in the town centre. There's also a risk that culture becomes a kind of performance for tourists rather than something genuine. So I'd say the key question is not whether tourism is good or bad, but who controls it and who receives the profits. To answer the follow-up questions, I think local people benefit most when they own businesses themselves, for example homestays, rather than simply working for large outside companies. And yes, I do think very popular places should limit visitor numbers, at least at peak times, as some heritage sites already do.",
    usefulLanguage: ["On balance, I'd argue that…, provided that…", "That said, the problems are real.", "The key question is not whether…, but…", "as we've seen with…"],
  },
  /* ------------------------------ Mock 3 ------------------------------ */
  {
    id: "sp-m3-p1",
    level: "B1",
    title: "Shopping · Friends",
    topic: "Daily life",
    instructions: P1_INSTR,
    content: {
      part: 1,
      topics: [
        { name: "Shopping", questions: ["Do you enjoy shopping? Why or why not?", "Do you prefer shopping online or in stores?", "What was the last thing you bought?"] },
        { name: "Friends", questions: ["How often do you meet your friends?", "What do you usually do together?", "What makes someone a good friend?"] },
      ],
    },
    ...P1,
    modelResponse:
      "To be honest, I don't really enjoy shopping for clothes, because I find it tiring to walk around crowded shops. I prefer shopping online, since it saves time and it's easy to compare prices, although sometimes the product looks different from the photo. The last thing I bought was a pair of running shoes, because my old ones were completely worn out. As for friends, I meet my close friends about once a week, usually on Saturday evening. We often go to a café, have dinner together or sometimes play football. I think a good friend is someone you can trust and who supports you when you have problems. They don't have to agree with you about everything, but they should be honest with you.",
    usefulLanguage: ["To be honest, …", "I prefer… since…", "As for…, …", "I think a good friend is someone who…"],
  },
  {
    id: "sp-m3-p2",
    level: "B2",
    title: "Reducing a company's carbon footprint",
    topic: "Work & environment",
    instructions: P2_INSTR,
    content: {
      part: 2,
      situation: "The company you work for wants to reduce its impact on the environment this year. Managers have asked staff to choose one main action.",
      options: ["Allow staff to work from home two days a week", "Replace company cars with electric vehicles", "Ban single-use plastic in the office"],
    },
    ...P2,
    modelResponse:
      "I would choose allowing staff to work from home two days a week. In my view, this would have the biggest impact, because commuting is one of the largest sources of emissions for an office company. If two hundred employees stop travelling to work twice a week, that means thousands fewer journeys every month. On top of that, it costs the company almost nothing, and most staff would see it as a benefit, so it would be easy to introduce. Replacing company cars with electric vehicles is a good long-term idea, but it requires a huge investment, and if the electricity comes mainly from coal, the environmental benefit is smaller than people think. Banning single-use plastic is cheap and sends a clear message, but honestly, the amount of plastic used in an office is quite small, so the overall effect would be limited. Perhaps the company could do this as well, but I don't think it should be the main action.",
    usefulLanguage: ["I would choose… In my view, this would have the biggest impact because…", "On top of that, …", "…is a good long-term idea, but…", "the overall effect would be limited"],
  },
  {
    id: "sp-m3-p3",
    level: "C1",
    title: "Taking a gap year",
    topic: "Education & young people",
    instructions: P3_INSTR,
    content: {
      part: 3,
      topic: "Young people should take a gap year before starting university.",
      ideas: ["maturity and independence", "work or travel experience", "falling behind / losing motivation", "(your own ideas)"],
      followUps: ["Why are gap years less common in Vietnam than in some Western countries?", "What should a young person do to make a gap year useful?", "Would you consider taking a gap year? Why or why not?"],
    },
    ...P3,
    modelResponse:
      "I think a gap year can be extremely valuable, but I wouldn't say that every young person should take one. Let me start with the benefits. Many students choose a university subject at eighteen without really knowing what they want, partly because of pressure from family. A year spent working, volunteering or travelling gives them time to mature and discover their interests, so they're more likely to choose the right course and study with real motivation. They also develop independence, for instance managing money or living away from home for the first time, and employers increasingly value that kind of experience. On the other hand, there are genuine risks. Some students lose the habit of studying and find it difficult to return, and if the year isn't planned, it can easily turn into twelve months of doing very little. For families with limited resources, a gap year may also simply be unaffordable, especially if it involves travel. So, in my view, the decision should depend on the individual and, crucially, on having a clear plan. Turning to the follow-up questions, I think gap years are less common in Vietnam because there's a strong expectation that students go straight from school to university, and taking a year off can be seen as falling behind. Personally, I'd consider it only if I had a concrete project, such as a structured volunteering programme.",
    usefulLanguage: ["I wouldn't say that every…", "Let me start with…", "On the other hand, there are genuine risks.", "Crucially, …", "Turning to the follow-up questions, …"],
  },
  /* ----------------------------- Practice ----------------------------- */
  {
    id: "sp-p-b1-p1",
    level: "B1",
    title: "Family & home · Music",
    topic: "Personal life",
    instructions: P1_INSTR,
    content: {
      part: 1,
      topics: [
        { name: "Family & home", questions: ["Who do you live with?", "Describe your favourite room in your home.", "Do you help with housework? What do you do?"] },
        { name: "Music", questions: ["What kind of music do you like?", "When do you usually listen to music?", "Have you ever learned to play an instrument?"] },
      ],
    },
    ...P1,
    modelResponse:
      "I live with my parents and my younger brother in a small house in the suburbs. My favourite room is my bedroom, because it's quiet and I've decorated it with photos and plants, so it feels very personal. Yes, I help with the housework. I usually wash the dishes after dinner and clean the living room at the weekend. As for music, I like pop and some Vietnamese indie bands. I usually listen to music when I'm travelling to school or when I'm studying, because it helps me concentrate. When I was ten, I learned the piano for two years, but I stopped because I didn't have enough time. I sometimes regret that now.",
    usefulLanguage: ["My favourite… is… because…", "I usually… at the weekend.", "When I was…, I…", "I sometimes regret…"],
  },
  {
    id: "sp-p-b2-p1",
    level: "B2",
    title: "Technology · Travel",
    topic: "Lifestyle",
    instructions: P1_INSTR,
    content: {
      part: 1,
      topics: [
        { name: "Technology", questions: ["Which piece of technology could you not live without?", "Do you think you spend too much time on your phone?", "How has technology changed the way you study?"] },
        { name: "Travel", questions: ["Where did you go on your last trip?", "Do you prefer travelling independently or on a tour?", "What place would you most like to visit in the future?"] },
      ],
    },
    ...P1,
    modelResponse:
      "I honestly couldn't live without my laptop, since I use it for studying, working on projects and keeping in touch with people. I probably do spend too much time on my phone, particularly in the evening, when I end up scrolling for an hour without noticing. Technology has completely changed the way I study: I can watch lectures again, search for explanations instantly and share notes with classmates online. My last trip was to Quy Nhon with some friends during the summer holiday. I much prefer travelling independently, because I can choose my own schedule and spend longer in places I like, whereas tours tend to be rushed. In the future, I'd love to visit Japan, mainly because I'm fascinated by the mix of traditional culture and modern cities.",
    usefulLanguage: ["I honestly couldn't live without…", "I end up… without noticing.", "…whereas…", "I'm fascinated by…"],
  },
  {
    id: "sp-p-c1-p1",
    level: "C1",
    title: "News & media · Work-life balance",
    topic: "Society",
    instructions: P1_INSTR,
    content: {
      part: 1,
      topics: [
        { name: "News & media", questions: ["How do you usually keep up with the news?", "Do you trust the news you read online?", "Should children be protected from bad news?"] },
        { name: "Work-life balance", questions: ["How do you balance work or study with rest?", "Is it harder to switch off from work today than in the past?", "What could employers do to support a healthier balance?"] },
      ],
    },
    ...P1,
    modelResponse:
      "I mostly keep up with the news through a couple of online newspapers and a podcast I listen to on my way to work. I'm fairly sceptical about what I read on social media, so if a story seems surprising, I check whether reputable outlets are reporting it too. As for children, I don't think they should be shielded from bad news entirely, but it needs to be explained in a way that's appropriate for their age, otherwise they may pick up frightening and distorted versions from elsewhere. In terms of work-life balance, I try to keep my evenings free and I make a point of exercising three times a week. I'd say it's definitely harder to switch off nowadays, because smartphones mean we're always reachable. Employers could help by setting clear expectations, for instance that nobody is expected to reply to messages outside working hours.",
    usefulLanguage: ["I'm fairly sceptical about…", "I don't think… entirely, but…", "I make a point of…", "I'd say it's definitely…"],
  },
  {
    id: "sp-p-b1-p2",
    level: "B1",
    title: "Saving money for a trip",
    topic: "Money",
    instructions: P2_INSTR,
    content: {
      part: 2,
      situation: "You want to travel with friends next summer, but you need to save about five million dong in six months.",
      options: ["Get a part-time job", "Spend less money every week", "Borrow the money from your parents"],
    },
    ...P2,
    modelResponse:
      "I think the best option is to get a part-time job. If I work two or three evenings a week, for example in a café, I can easily earn five million dong in six months. Also, I can learn useful skills and meet new people. Spending less money every week is a good idea too, but it's difficult to save a lot this way, because I don't spend very much now. I could stop buying bubble tea, but that only saves a little. Borrowing money from my parents is the easiest option, but I don't think it's a good idea. The trip is for fun, so I should pay for it myself, and I don't want to put pressure on my family. The only problem with a part-time job is that I need time to study, so I should choose a job with flexible hours.",
    usefulLanguage: ["I think the best option is… because…", "…is a good idea too, but…", "The only problem with… is…", "I don't want to…"],
  },
  {
    id: "sp-p-b2-p2",
    level: "B2",
    title: "Reducing traffic jams",
    topic: "Cities",
    instructions: P2_INSTR,
    content: {
      part: 2,
      situation: "Traffic jams in your city are getting worse every year. The city government is considering three solutions.",
      options: ["Add more bus routes and buses", "Increase parking fees in the city centre", "Encourage companies to offer flexible working hours"],
    },
    ...P2,
    modelResponse:
      "Out of the three options, I'd go for adding more bus routes and buses. The main reason is that it gives people a real alternative to motorbikes and cars. At the moment, many people would like to use public transport, but the buses don't go where they need to, or they come too rarely. If the network were better, a lot of people would switch, and each bus can replace dozens of motorbikes. Raising parking fees might reduce the number of cars in the centre, but it doesn't solve the problem of how people will travel instead, and it's unfair to those on low incomes. Flexible working hours could spread traffic more evenly through the day, which is helpful, but many jobs, such as in schools or factories, simply can't be flexible, so the effect would be limited. Ideally, I think the city should combine more buses with flexible hours, but buses should come first.",
    usefulLanguage: ["Out of the three options, I'd go for…", "The main reason is that…", "…might…, but it doesn't solve…", "Ideally, …"],
  },
  {
    id: "sp-p-c1-p2",
    level: "C1",
    title: "Allocating a university budget",
    topic: "Education",
    instructions: P2_INSTR,
    content: {
      part: 2,
      situation: "Your university has received extra funding but can only afford one major project this year.",
      options: ["Build a new library and study centre", "Offer more scholarships to students from low-income families", "Expand mental health and counselling services"],
    },
    ...P2,
    modelResponse:
      "This is a difficult choice, because all three would clearly benefit students, but I'd argue that expanding mental health and counselling services is the most pressing need. Rates of anxiety and depression among university students appear to have risen considerably, and when counselling is under-resourced, students can wait weeks for an appointment, which is far too long for someone in crisis. Crucially, this option is relatively inexpensive and its impact is immediate. Scholarships are enormously valuable for widening access, and in a sense they're about fairness, but the extra funding is a one-off, so it could support only a limited number of students for a limited time, whereas services, once established, help everyone. As for a new library, while it would certainly be welcome, much study material is now available online, and existing spaces could perhaps be used more efficiently, for example by extending opening hours. So, on balance, counselling offers the greatest benefit per dollar.",
    usefulLanguage: ["I'd argue that… is the most pressing need.", "Crucially, …", "…whereas…", "On balance, … offers the greatest…"],
  },
  {
    id: "sp-p-b1-p3",
    level: "B1",
    title: "The benefits of reading books",
    topic: "Hobbies",
    instructions: P3_INSTR,
    content: {
      part: 3,
      topic: "Reading books is good for young people.",
      ideas: ["learn new words and knowledge", "improve imagination", "relax and reduce stress", "(your own ideas)"],
      followUps: ["Do you prefer paper books or e-books?", "Why do many young people read less today?", "What book would you recommend to a friend?"],
    },
    ...P3,
    modelResponse:
      "I think reading books is very good for young people, for several reasons. Firstly, reading helps us learn new words and new knowledge. When I read a story or a book about history, I often find words that I don't know, and later I can use them when I speak or write. Secondly, books improve our imagination. When we read a novel, we have to imagine the characters and places ourselves, which is different from watching a film. Thirdly, reading is a good way to relax. After a long day at school, reading for thirty minutes before bed helps me forget about stress and sleep better. Another benefit is that reading helps us concentrate for a long time, which is important for studying. About the follow-up questions, I prefer paper books, because I can't concentrate well on a screen. I think young people read less today because they spend a lot of time on social media and games. I would recommend 'The Little Prince' to my friends, because it is short but has a lot of meaning.",
    usefulLanguage: ["Firstly, … Secondly, … Thirdly, …", "Another benefit is that…", "which is different from…", "I would recommend… because…"],
  },
  {
    id: "sp-p-b2-p3",
    level: "B2",
    title: "Online learning versus classrooms",
    topic: "Education",
    instructions: P3_INSTR,
    content: {
      part: 3,
      topic: "Online learning can replace traditional classrooms.",
      ideas: ["flexibility and cost", "self-discipline", "social interaction and practical skills", "(your own ideas)"],
      followUps: ["What subjects are hardest to learn online?", "Did you have any experience of online learning? How was it?", "How can teachers make online classes more engaging?"],
    },
    ...P3,
    modelResponse:
      "I don't think online learning can completely replace traditional classrooms, although it can certainly play a bigger role than it did in the past. On the positive side, online learning is very flexible. Students can watch lessons at their own pace and from anywhere, which is great for people who work or live far from a school. It can also be cheaper, because there are no travel costs. However, online learning requires a lot of self-discipline. It's very easy to turn off the camera and do something else, and many students find it hard to stay motivated without a teacher in the room. More importantly, school is not only about knowledge. In a classroom, students learn to cooperate, discuss ideas face to face and make friends, and these social skills are difficult to develop on a screen. Practical subjects like chemistry or sport also need real equipment. So I think the best approach is blended learning, where some content is online and some is in class. As for the follow-up questions, I studied online during the pandemic, and honestly, I found it tiring and lonely after a few weeks, although recorded lectures were useful for revision.",
    usefulLanguage: ["I don't think… completely…, although…", "On the positive side, …", "More importantly, …", "So I think the best approach is…"],
  },
  {
    id: "sp-p-c1-p3",
    level: "C1",
    title: "Artificial intelligence in education",
    topic: "Technology & education",
    instructions: P3_INSTR,
    content: {
      part: 3,
      topic: "Artificial intelligence will do more good than harm in education.",
      ideas: ["personalised learning and feedback", "academic honesty", "the role of teachers", "(your own ideas)"],
      followUps: ["Should students be allowed to use AI tools for homework?", "What skills will be most important for students in an age of AI?", "Could AI make education more equal or less equal?"],
    },
    ...P3,
    modelResponse:
      "I'm cautiously optimistic that AI will do more good than harm in education, but the outcome depends heavily on how schools respond. The most promising benefit is personalisation. A teacher with forty students simply can't give each one detailed feedback every day, whereas an AI tutor can explain a problem in several different ways until a student understands, and it's available at any hour. For learners in rural areas, or families who can't afford private tutoring, that could be genuinely transformative. The obvious concern is academic honesty. If a tool can write an essay in seconds, traditional homework loses much of its value as evidence of learning. But I'd argue this is less a reason to ban AI than a reason to rethink assessment, with more in-class writing, oral exams and projects that show the process, not just the product. There's also a deeper risk that students outsource thinking itself and never develop the ability to struggle with a difficult problem. That's why the role of teachers becomes more important, not less: they need to decide when AI supports learning and when it short-circuits it. Turning to the follow-ups, I think AI could make education more equal, but only if access is free and schools teach students how to use these tools critically; otherwise, it may widen existing gaps.",
    usefulLanguage: ["I'm cautiously optimistic that…", "The outcome depends heavily on…", "I'd argue this is less a reason to… than a reason to…", "…becomes more important, not less"],
  },
];
