import type { ReadingSetInput } from "@/domain/content-schema";

export const readingPractice: ReadingSetInput[] = [
  /* ------------------------------- B1 ------------------------------- */
  {
    id: "rd-p-b1-1",
    title: "Never Too Late to Swim",
    level: "B1",
    topic: "Sport & personal development",
    passage: `At the age of forty-two, Nguyen Van Duc finally learned to swim. As a child growing up far from the sea, he never had lessons, and as an adult he was too embarrassed to admit that he could not swim. "Whenever my friends went to the beach, I stayed on the sand and said I wanted to read," he explains. "The truth was that I was afraid of the water."

Everything changed when his daughter started swimming lessons. Watching her from the side of the pool every Saturday, Duc realised that he would never be able to help her if she got into trouble in the water. A few weeks later, he signed up for a beginners' course for adults at the same sports centre.

The first lesson was the hardest. Duc was the oldest person in the group, and he felt nervous just standing in water that came up to his chest. The instructor, a patient young woman called Linh, did not ask anyone to swim at all. Instead, she spent the whole lesson teaching the group how to breathe calmly with their faces in the water. "Most adults who can't swim are not missing a skill," Linh says. "They are missing confidence. If you can relax, the rest is much easier."

After that, progress came more quickly than Duc expected. By the fourth week he could float on his back, and by the end of the ten-week course he could swim twenty-five metres without stopping. He now swims three mornings a week before work and says he feels healthier than he has for years.

Duc's story is not unusual. According to the sports centre, the number of adults joining beginners' courses has risen every year since it started offering them. Many students, like Duc, are parents who want to be able to keep their children safe. Others simply want a form of exercise that is gentle on the body.

For anyone thinking of learning, Duc has one piece of advice: "Don't wait until you feel ready. You will never feel ready. Just go to the first lesson."`,
    questions: [
      {
        id: "rd-p-b1-1-q1",
        type: "main_idea",
        difficulty: 1,
        prompt: "What is the text mainly about?",
        options: { A: "A man who learned to swim as an adult", B: "A swimming competition for parents", C: "How to become a swimming instructor", D: "The dangers of swimming in the sea" },
        answer: "A",
        explanation: "The text tells how Duc learned to swim at forty-two and what other adults can learn from his experience.",
        evidence: { ref: "P1", quote: "At the age of forty-two, Nguyen Van Duc finally learned to swim." },
      },
      {
        id: "rd-p-b1-1-q2",
        type: "inference",
        difficulty: 2,
        prompt: "Why did Duc say he wanted to read when his friends went swimming?",
        options: { A: "He was hiding his fear of the water.", B: "He loved reading on the beach.", C: "He did not like his friends.", D: "The sea was too cold." },
        answer: "A",
        explanation: "He admits that the truth was that he was afraid of the water.",
        evidence: { ref: "P1", quote: "The truth was that I was afraid of the water." },
      },
      {
        id: "rd-p-b1-1-q3",
        type: "detail",
        difficulty: 2,
        prompt: "What made Duc decide to take lessons?",
        options: {
          A: "He wanted to be able to help his daughter in the water.",
          B: "His doctor told him to exercise more.",
          C: "His friends invited him to the beach.",
          D: "The sports centre offered free lessons.",
        },
        answer: "A",
        explanation: "Watching his daughter, he realised he could not help her if she got into trouble in the water.",
        evidence: { ref: "P2", quote: "he would never be able to help her if she got into trouble in the water" },
      },
      {
        id: "rd-p-b1-1-q4",
        type: "detail",
        difficulty: 2,
        prompt: "What did the group do in the first lesson?",
        options: {
          A: "They practised breathing calmly with their faces in the water.",
          B: "They swam twenty-five metres.",
          C: "They learned to float on their backs.",
          D: "They watched the children's lesson.",
        },
        answer: "A",
        explanation: "The instructor spent the whole lesson teaching them to breathe calmly with their faces in the water.",
        evidence: { ref: "P3", quote: "teaching the group how to breathe calmly with their faces in the water" },
      },
      {
        id: "rd-p-b1-1-q5",
        type: "inference",
        difficulty: 3,
        prompt: "According to Linh, what do most adult beginners need most?",
        options: { A: "Confidence", B: "Strength", C: "Better equipment", D: "More lessons" },
        answer: "A",
        explanation: "She says adults who can't swim are not missing a skill but confidence.",
        evidence: { ref: "P3", quote: "They are missing confidence." },
      },
      {
        id: "rd-p-b1-1-q6",
        type: "detail",
        difficulty: 2,
        prompt: "What could Duc do by the end of the course?",
        options: { A: "Swim twenty-five metres without stopping", B: "Swim for one hour", C: "Teach his daughter to swim", D: "Swim in the sea" },
        answer: "A",
        explanation: "By the end of the ten-week course he could swim twenty-five metres without stopping.",
        evidence: { ref: "P4", quote: "he could swim twenty-five metres without stopping" },
      },
      {
        id: "rd-p-b1-1-q7",
        type: "reference",
        difficulty: 2,
        prompt: 'The word "it" in "since it started offering them" (paragraph 5) refers to',
        options: { A: "the sports centre", B: "the number of adults", C: "the course", D: "the pool" },
        answer: "A",
        explanation: "The sports centre has offered beginners' courses, and numbers have risen every year since it started.",
        evidence: { ref: "P5", quote: "According to the sports centre, the number of adults joining beginners' courses has risen every year since it started offering them." },
      },
      {
        id: "rd-p-b1-1-q8",
        type: "attitude",
        difficulty: 2,
        prompt: "What is Duc's advice to people who want to learn to swim?",
        options: { A: "Start now instead of waiting to feel ready.", B: "Practise alone first.", C: "Only learn with a private teacher.", D: "Wait until you are not afraid." },
        answer: "A",
        explanation: "He says you will never feel ready, so you should just go to the first lesson.",
        evidence: { ref: "P6", quote: "Don't wait until you feel ready." },
      },
    ],
  },
  {
    id: "rd-p-b1-2",
    title: "Two Days in Hoi An",
    level: "B1",
    topic: "Travel",
    passage: `Last month my sister and I finally visited Hoi An, the old trading town in central Vietnam that everyone had told us we must see. We only had a weekend, so we planned carefully. Here are a few things we learned that might help other travellers.

First, arrive early. We took the first bus from Da Nang, which costs very little and takes about an hour, and we reached the Ancient Town before eight o'clock. The narrow streets were almost empty, and we could take photos of the yellow houses without crowds of people in the way. By ten o'clock, the town was full of tour groups, and it was much harder to walk around.

Second, buy the entrance ticket. Visitors need a ticket to enter some of the old houses, temples and museums. At first we thought it was not worth the money, but the ticket includes five sites, and each one has information about the town's history as a busy port where traders from Japan, China and Europe once lived. The small museum about pottery was my favourite.

Third, rent a bicycle. On our second day, we cycled out of the town to the rice fields and then to An Bang beach. It took about twenty minutes, and the road was flat and quiet. We stopped at a small café in the fields and watched farmers working while we drank coconut coffee. It was the most relaxing part of our trip.

Finally, think carefully before having clothes made. Hoi An is famous for its tailors, who can make a dress or a suit in a day. My sister ordered a dress, and it looked beautiful in the shop. However, when she tried it on at home, it was too tight. Next time, we will allow more time so that we can go back for a second fitting.

In the evening, the Ancient Town is lit by hundreds of colourful lanterns, and it really is magical. Just be prepared to share it with many other visitors!`,
    questions: [
      {
        id: "rd-p-b1-2-q1",
        type: "purpose",
        difficulty: 2,
        prompt: "What is the main purpose of the text?",
        options: { A: "To give advice to people visiting Hoi An", B: "To describe the history of Vietnam", C: "To advertise a hotel", D: "To complain about a holiday" },
        answer: "A",
        explanation: "The writer shares things they learned that might help other travellers.",
        evidence: { ref: "P1", quote: "Here are a few things we learned that might help other travellers." },
      },
      {
        id: "rd-p-b1-2-q2",
        type: "detail",
        difficulty: 2,
        prompt: "Why does the writer recommend arriving early?",
        options: { A: "The streets are quieter.", B: "The bus is cheaper.", C: "The museums close at ten.", D: "It is cooler for cycling." },
        answer: "A",
        explanation: "Before eight the streets were almost empty, but by ten they were full of tour groups.",
        evidence: { ref: "P2", quote: "The narrow streets were almost empty" },
      },
      {
        id: "rd-p-b1-2-q3",
        type: "detail",
        difficulty: 2,
        prompt: "What does the entrance ticket include?",
        options: { A: "Entry to five sites", B: "A guided tour", C: "A bicycle", D: "A bus ticket from Da Nang" },
        answer: "A",
        explanation: "The ticket includes five sites, such as old houses, temples and museums.",
        evidence: { ref: "P3", quote: "the ticket includes five sites" },
      },
      {
        id: "rd-p-b1-2-q4",
        type: "inference",
        difficulty: 3,
        prompt: "What did the writer think of the ticket in the end?",
        options: { A: "It was worth buying.", B: "It was too expensive.", C: "It was difficult to find.", D: "It was only useful for the pottery museum." },
        answer: "A",
        explanation: "At first they thought it was not worth the money, but the sites and information changed their mind.",
        evidence: { ref: "P3", quote: "At first we thought it was not worth the money" },
      },
      {
        id: "rd-p-b1-2-q5",
        type: "detail",
        difficulty: 2,
        prompt: "What was the most relaxing part of the trip?",
        options: { A: "Stopping at a café in the rice fields", B: "Visiting the pottery museum", C: "Shopping for clothes", D: "Seeing the lanterns at night" },
        answer: "A",
        explanation: "They watched farmers from a café in the fields while drinking coconut coffee, which they call the most relaxing part.",
        evidence: { ref: "P4", quote: "It was the most relaxing part of our trip." },
      },
      {
        id: "rd-p-b1-2-q6",
        type: "detail",
        difficulty: 2,
        prompt: "What was the problem with the dress?",
        options: { A: "It did not fit well.", B: "It was the wrong colour.", C: "It was not ready in time.", D: "It cost too much." },
        answer: "A",
        explanation: "When the sister tried it on at home, it was too tight.",
        evidence: { ref: "P5", quote: "it was too tight" },
      },
      {
        id: "rd-p-b1-2-q7",
        type: "vocabulary",
        difficulty: 3,
        prompt: 'The word "fitting" in paragraph 5 means',
        options: {
          A: "a time when you try on clothes so they can be adjusted",
          B: "a piece of furniture in a shop",
          C: "a type of fabric",
          D: "a discount for regular customers",
        },
        answer: "A",
        explanation: "A fitting is a visit to the tailor to try clothes on and have them adjusted; a second fitting would have fixed the tight dress.",
        evidence: { ref: "P5", quote: "go back for a second fitting" },
      },
      {
        id: "rd-p-b1-2-q8",
        type: "attitude",
        difficulty: 2,
        prompt: "How does the writer feel about Hoi An in the evening?",
        options: { A: "It is magical but crowded.", B: "It is boring.", C: "It is dangerous.", D: "It is too dark." },
        answer: "A",
        explanation: "The writer calls it magical but warns that you must share it with many visitors.",
        evidence: { ref: "P6", quote: "it really is magical" },
      },
    ],
  },
  /* ------------------------------- B2 ------------------------------- */
  {
    id: "rd-p-b2-1",
    title: "Recycling: Separating Myth from Reality",
    level: "B2",
    topic: "Environment",
    passage: `Recycling is often presented as the simplest thing ordinary people can do for the environment. Put the bottle in the right bin, the message goes, and it will be turned into something new. The reality is considerably more complicated, and some common beliefs about recycling turn out to be misleading.

One widespread myth is that everything placed in a recycling bin is recycled. In practice, a significant proportion is rejected at sorting facilities. Items contaminated with food or liquid can spoil whole batches of paper or cardboard, and many types of plastic have no buyers because they are too difficult or expensive to process. These materials often end up in landfill or are burned, despite the good intentions of the people who sorted them.

Plastics deserve particular attention. While bottles made from certain types of plastic are recycled relatively successfully, many other plastic items, such as food wrappers, cups with mixed layers and small objects, are rarely recycled at all. Even when plastic is recycled, its quality usually decreases each time, so it can only go through the process a limited number of times. Glass and metals, by contrast, can be recycled repeatedly without losing quality.

Another misconception is that recycling is the most effective way for individuals to reduce waste. Environmental experts usually describe a hierarchy: reducing what we use comes first, reusing items comes second, and recycling comes third. Recycling still requires energy to collect, transport and process materials, whereas a product that is never bought requires none.

None of this means that recycling is pointless. Recycling aluminium, for example, uses a small fraction of the energy needed to produce new aluminium from raw materials. The key is to recycle correctly: rinsing containers, following local rules about what is accepted, and not putting items in the recycling bin simply in the hope that they will be recyclable, a habit sometimes called "wishcycling".

Ultimately, recycling works best not as a substitute for using less, but as the final step after other options have been considered.`,
    questions: [
      {
        id: "rd-p-b2-1-q1",
        type: "main_idea",
        difficulty: 3,
        prompt: "What is the writer's main point?",
        options: {
          A: "Recycling is useful but more complicated and limited than many people think.",
          B: "Recycling is a waste of time.",
          C: "All plastics can be recycled many times.",
          D: "Governments should ban recycling bins.",
        },
        answer: "A",
        explanation: "The writer corrects several myths but says recycling is not pointless and works best as the final step.",
        evidence: { ref: "P1", quote: "The reality is considerably more complicated" },
      },
      {
        id: "rd-p-b2-1-q2",
        type: "detail",
        difficulty: 3,
        prompt: "Why are some items in recycling bins not recycled?",
        options: {
          A: "They are dirty or there is no market for them.",
          B: "Recycling workers do not have enough time.",
          C: "They are too heavy to transport.",
          D: "They have already been recycled once.",
        },
        answer: "A",
        explanation: "Contaminated items spoil batches, and many plastics have no buyers because processing is too difficult or expensive.",
        evidence: { ref: "P2", quote: "many types of plastic have no buyers" },
      },
      {
        id: "rd-p-b2-1-q3",
        type: "vocabulary",
        difficulty: 3,
        prompt: 'The word "contaminated" in paragraph 2 is closest in meaning to',
        options: { A: "made dirty", B: "carefully sorted", C: "made of plastic", D: "already used" },
        answer: "A",
        explanation: "Items with food or liquid on them are dirty, and this can spoil batches of paper.",
        evidence: { ref: "P2", quote: "Items contaminated with food or liquid can spoil whole batches of paper or cardboard" },
      },
      {
        id: "rd-p-b2-1-q4",
        type: "detail",
        difficulty: 3,
        prompt: "How is glass different from plastic, according to paragraph 3?",
        options: {
          A: "It can be recycled many times without losing quality.",
          B: "It is more difficult to recycle.",
          C: "It cannot be recycled at all.",
          D: "It is recycled into plastic.",
        },
        answer: "A",
        explanation: "Plastic loses quality each time, while glass and metals can be recycled repeatedly without losing quality.",
        evidence: { ref: "P3", quote: "Glass and metals, by contrast, can be recycled repeatedly without losing quality." },
      },
      {
        id: "rd-p-b2-1-q5",
        type: "inference",
        difficulty: 4,
        prompt: "Why is reducing consumption placed above recycling in the hierarchy?",
        options: {
          A: "A product that is never bought uses no energy at all.",
          B: "Recycling is illegal in some places.",
          C: "Reducing consumption saves people money.",
          D: "Recycling factories are unpopular.",
        },
        answer: "A",
        explanation: "Recycling still needs energy for collecting, transport and processing, whereas a product never bought needs none.",
        evidence: { ref: "P4", quote: "whereas a product that is never bought requires none" },
      },
      {
        id: "rd-p-b2-1-q6",
        type: "purpose",
        difficulty: 3,
        prompt: "Why does the writer mention aluminium?",
        options: {
          A: "To show that recycling can save a lot of energy",
          B: "To show that metals are hard to recycle",
          C: "To explain the waste hierarchy",
          D: "To give an example of wishcycling",
        },
        answer: "A",
        explanation: "Aluminium illustrates that recycling is not pointless: it uses a small fraction of the energy needed to produce new metal.",
        evidence: { ref: "P5", quote: "Recycling aluminium, for example, uses a small fraction of the energy" },
      },
      {
        id: "rd-p-b2-1-q7",
        type: "vocabulary",
        difficulty: 4,
        prompt: 'What does "wishcycling" mean in paragraph 5?',
        options: {
          A: "Putting items in recycling bins hoping they can be recycled",
          B: "Recycling items correctly after rinsing them",
          C: "Buying products made from recycled materials",
          D: "Wishing that recycling bins were emptied more often",
        },
        answer: "A",
        explanation: "The text defines it as putting items in the recycling bin simply in the hope that they will be recyclable.",
        evidence: { ref: "P5", quote: "not putting items in the recycling bin simply in the hope that they will be recyclable" },
      },
      {
        id: "rd-p-b2-1-q8",
        type: "attitude",
        difficulty: 3,
        prompt: "How does the writer see the role of recycling?",
        options: {
          A: "As the last step after using less and reusing",
          B: "As the most important environmental action",
          C: "As something that should be stopped",
          D: "As a replacement for reducing waste",
        },
        answer: "A",
        explanation: "The conclusion says recycling works best as the final step, not as a substitute for using less.",
        evidence: { ref: "P6", quote: "as the final step after other options have been considered" },
      },
    ],
  },
  {
    id: "rd-p-b2-2",
    title: "The Science of Habits",
    level: "B2",
    topic: "Psychology",
    passage: `Every New Year, millions of people promise themselves they will exercise more, eat better or spend less time on their phones. By February, most of these resolutions have been abandoned. Psychologists who study habits argue that the problem is rarely a lack of willpower. Instead, it is that people try to change their behaviour without understanding how habits actually work.

A habit is a behaviour that has become largely automatic. Researchers often describe it as a loop with three parts: a cue, a routine and a reward. The cue is a trigger, such as a time of day, a place or a feeling. The routine is the behaviour itself, and the reward is the benefit that makes the brain want to repeat it. Checking a phone when it vibrates, for example, may bring the small pleasure of a new message, which strengthens the link between the cue and the action.

Because habits are triggered by cues, one of the most effective ways to change behaviour is to change the environment. Someone who wants to eat less sugar is more likely to succeed if they stop keeping sweets in the house than if they simply try to resist temptation every evening. Similarly, people who want to exercise in the morning are advised to put their sports clothes next to the bed the night before, so that the cue for exercising is the first thing they see.

Another useful strategy is to attach a new habit to an existing one. A person who already makes coffee every morning might decide to do five minutes of stretching while the water boils. Since the existing routine is already automatic, it can act as a reliable cue for the new behaviour.

It is also important to be realistic about time. A frequently quoted claim that habits form in twenty-one days is not supported by research. One well-known study found that the time needed for a behaviour to become automatic varied enormously, from a few weeks to many months, depending on the person and the complexity of the behaviour. Encouragingly, the same study found that missing a single day did not seriously affect the process.

In short, lasting change may depend less on heroic effort than on designing daily life so that good behaviour becomes the easy choice.`,
    questions: [
      {
        id: "rd-p-b2-2-q1",
        type: "main_idea",
        difficulty: 3,
        prompt: "What is the main idea of the passage?",
        options: {
          A: "Understanding how habits work makes it easier to change behaviour.",
          B: "Most people have very little willpower.",
          C: "New Year's resolutions are always successful.",
          D: "Habits form in exactly twenty-one days.",
        },
        answer: "A",
        explanation: "The writer argues that people fail because they do not understand how habits work, then describes strategies based on that understanding.",
        evidence: { ref: "P1", quote: "people try to change their behaviour without understanding how habits actually work" },
      },
      {
        id: "rd-p-b2-2-q2",
        type: "detail",
        difficulty: 2,
        prompt: "What are the three parts of a habit loop?",
        options: {
          A: "A cue, a routine and a reward",
          B: "A goal, a plan and a result",
          C: "A feeling, a decision and a habit",
          D: "A time, a place and a person",
        },
        answer: "A",
        explanation: "Researchers describe the loop as a cue, a routine and a reward.",
        evidence: { ref: "P2", quote: "a cue, a routine and a reward" },
      },
      {
        id: "rd-p-b2-2-q3",
        type: "purpose",
        difficulty: 3,
        prompt: "Why does the writer mention a phone vibrating?",
        options: {
          A: "To illustrate how a reward strengthens a habit",
          B: "To warn about the dangers of phones",
          C: "To show that habits cannot be changed",
          D: "To give an example of a healthy habit",
        },
        answer: "A",
        explanation: "The vibration is the cue, checking is the routine, and the pleasure of a message is the reward that strengthens the link.",
        evidence: { ref: "P2", quote: "which strengthens the link between the cue and the action" },
      },
      {
        id: "rd-p-b2-2-q4",
        type: "detail",
        difficulty: 3,
        prompt: "According to paragraph 3, what is one of the most effective ways to change behaviour?",
        options: { A: "Changing your environment", B: "Trying harder to resist temptation", C: "Asking a friend for help", D: "Setting more ambitious goals" },
        answer: "A",
        explanation: "Because habits are triggered by cues, changing the environment is described as one of the most effective methods.",
        evidence: { ref: "P3", quote: "one of the most effective ways to change behaviour is to change the environment" },
      },
      {
        id: "rd-p-b2-2-q5",
        type: "inference",
        difficulty: 4,
        prompt: "Why is putting sports clothes next to the bed recommended?",
        options: {
          A: "It provides a visible cue to exercise in the morning.",
          B: "It saves money on new clothes.",
          C: "It makes the bedroom tidier.",
          D: "It is a reward after exercising.",
        },
        answer: "A",
        explanation: "The clothes become the first thing people see, acting as the cue for exercising.",
        evidence: { ref: "P3", quote: "so that the cue for exercising is the first thing they see" },
      },
      {
        id: "rd-p-b2-2-q6",
        type: "reference",
        difficulty: 3,
        prompt: 'The word "it" in "it can act as a reliable cue" (paragraph 4) refers to',
        options: { A: "the existing routine", B: "the new behaviour", C: "the water", D: "the coffee" },
        answer: "A",
        explanation: "The existing routine is already automatic, so it can act as a reliable cue for the new behaviour.",
        evidence: { ref: "P4", quote: "Since the existing routine is already automatic, it can act as a reliable cue for the new behaviour." },
      },
      {
        id: "rd-p-b2-2-q7",
        type: "detail",
        difficulty: 4,
        prompt: "What did the study mentioned in paragraph 5 find?",
        options: {
          A: "The time needed to form a habit varied greatly between people.",
          B: "All habits form in twenty-one days.",
          C: "Missing one day destroys a new habit.",
          D: "Complex habits form more quickly than simple ones.",
        },
        answer: "A",
        explanation: "The time varied enormously, from a few weeks to many months, depending on the person and the behaviour.",
        evidence: { ref: "P5", quote: "varied enormously, from a few weeks to many months" },
        distractors: { C: "The study found missing a single day did not seriously affect the process." },
      },
      {
        id: "rd-p-b2-2-q8",
        type: "attitude",
        difficulty: 3,
        prompt: "What does the writer suggest in the conclusion?",
        options: {
          A: "Arranging daily life to make good choices easy is more effective than relying on effort.",
          B: "Changing habits requires enormous willpower.",
          C: "It is impossible to change old habits.",
          D: "People should make more New Year's resolutions.",
        },
        answer: "A",
        explanation: "Lasting change depends less on heroic effort than on making good behaviour the easy choice.",
        evidence: { ref: "P6", quote: "designing daily life so that good behaviour becomes the easy choice" },
      },
    ],
  },
  /* ------------------------------- C1 ------------------------------- */
  {
    id: "rd-p-c1-1",
    title: "When the Algorithm Decides Who Gets Hired",
    level: "C1",
    topic: "Technology & ethics",
    passage: `Faced with thousands of applications for a single vacancy, many large employers now rely on automated systems to screen candidates. Software scans CVs for relevant keywords, ranks applicants against the profiles of successful past employees and, in some cases, analyses recorded video interviews. Advocates argue that such tools save time and can even reduce discrimination, since an algorithm does not share the prejudices of a tired or biased human recruiter.

The difficulty is that algorithms learn from data, and data reflect history. A system trained on the CVs of people who were hired in the past will tend to favour candidates who resemble them. If an industry has historically employed few women in technical roles, for instance, a model may learn to associate the characteristics of male applicants with success, not because those characteristics predict performance but because they were common among those previously selected. In one widely reported case, a technology company abandoned an experimental recruiting tool after discovering that it penalised CVs containing the word "women's", as in "women's chess club".

Such outcomes are particularly troubling because they can be hard to detect. A human recruiter who rejects candidates unfairly may eventually be challenged; an algorithm that does so at scale may operate unnoticed for years, its decisions lent an air of objectivity by the very fact that they are produced by a machine. Candidates who are rejected rarely learn why, and may not even know that software was involved.

None of this implies that human judgement is a gold standard. Decades of research document the inconsistency of traditional interviews, in which first impressions and irrelevant factors such as a shared hometown can sway decisions. The relevant question is therefore not whether algorithms are perfect, but whether they are better or worse than the alternatives, and for whom.

Answering that question requires transparency. Some jurisdictions have begun to require employers to audit automated hiring tools for bias and to inform applicants when such tools are used. Researchers have also proposed techniques for testing whether a model's outcomes differ between groups, and for identifying which features drive its decisions. These measures are still developing, and auditing a system is considerably easier than fixing one.

What seems clear is that delegating decisions to software does not remove responsibility from the organisations that use it. If anything, it raises the stakes, because errors that once affected individuals can now be replicated across thousands of applications in an instant.`,
    questions: [
      {
        id: "rd-p-c1-1-q1",
        type: "main_idea",
        difficulty: 4,
        prompt: "What is the passage primarily about?",
        options: {
          A: "The risks and responsibilities involved in using algorithms for hiring",
          B: "How to write a CV that passes automated screening",
          C: "Why human recruiters should be replaced by software",
          D: "The history of discrimination in the technology industry",
        },
        answer: "A",
        explanation: "The passage examines how hiring algorithms can reproduce bias, why this is hard to detect, and why organisations remain responsible.",
        evidence: { ref: "P6", quote: "delegating decisions to software does not remove responsibility from the organisations that use it" },
      },
      {
        id: "rd-p-c1-1-q2",
        type: "detail",
        difficulty: 3,
        prompt: "According to advocates, how might automated tools reduce discrimination?",
        options: {
          A: "They do not share the prejudices of human recruiters.",
          B: "They only consider candidates' qualifications from top universities.",
          C: "They hide candidates' names from employers.",
          D: "They are trained by experts in equality law.",
        },
        answer: "A",
        explanation: "Advocates argue an algorithm does not share the prejudices of a tired or biased human recruiter.",
        evidence: { ref: "P1", quote: "an algorithm does not share the prejudices of a tired or biased human recruiter" },
      },
      {
        id: "rd-p-c1-1-q3",
        type: "inference",
        difficulty: 5,
        prompt: 'What does the writer mean by "data reflect history"?',
        options: {
          A: "Past hiring patterns, including unfair ones, are built into the data algorithms learn from.",
          B: "Algorithms are designed using historical documents.",
          C: "Old data is usually inaccurate.",
          D: "Algorithms can predict future history.",
        },
        answer: "A",
        explanation: "A system trained on past hires will favour candidates who resemble them, reproducing historical patterns such as the under-representation of women.",
        evidence: { ref: "P2", quote: "A system trained on the CVs of people who were hired in the past will tend to favour candidates who resemble them." },
      },
      {
        id: "rd-p-c1-1-q4",
        type: "purpose",
        difficulty: 4,
        prompt: "Why does the writer mention the recruiting tool that penalised the word \"women's\"?",
        options: {
          A: "As a real example of an algorithm reproducing bias",
          B: "To show that chess clubs are unpopular",
          C: "To prove that all algorithms are sexist",
          D: "To explain how keywords are scanned",
        },
        answer: "A",
        explanation: "It illustrates the risk described in the paragraph: a model learning to disadvantage women because of historical patterns.",
        evidence: { ref: "P2", quote: "it penalised CVs containing the word" },
      },
      {
        id: "rd-p-c1-1-q5",
        type: "inference",
        difficulty: 5,
        prompt: "According to paragraph 3, why can algorithmic bias be especially hard to detect?",
        options: {
          A: "Machine decisions seem objective, and rejected candidates rarely learn the reasons.",
          B: "Algorithms delete their records after each decision.",
          C: "Only a few candidates are affected.",
          D: "Recruiters deliberately hide the software.",
        },
        answer: "A",
        explanation: "Algorithmic decisions have an air of objectivity, operate at scale, and candidates rarely learn why they were rejected.",
        evidence: { ref: "P3", quote: "its decisions lent an air of objectivity by the very fact that they are produced by a machine" },
      },
      {
        id: "rd-p-c1-1-q6",
        type: "organisation",
        difficulty: 5,
        prompt: "What is the role of paragraph 4 in the writer's argument?",
        options: {
          A: "It acknowledges that human hiring is also flawed, reframing the question as a comparison.",
          B: "It argues that interviews should be abolished.",
          C: "It provides further examples of biased algorithms.",
          D: "It concludes that algorithms are perfect.",
        },
        answer: "A",
        explanation: "The writer admits traditional interviews are inconsistent, so the real question is whether algorithms are better or worse than the alternatives.",
        evidence: { ref: "P4", quote: "The relevant question is therefore not whether algorithms are perfect, but whether they are better or worse than the alternatives" },
      },
      {
        id: "rd-p-c1-1-q7",
        type: "detail",
        difficulty: 4,
        prompt: "What have some jurisdictions begun to require?",
        options: {
          A: "Bias audits of hiring tools and notification of applicants",
          B: "A ban on all automated hiring",
          C: "Video interviews for every candidate",
          D: "Hiring quotas for technical roles",
        },
        answer: "A",
        explanation: "Some jurisdictions require employers to audit tools for bias and inform applicants when tools are used.",
        evidence: { ref: "P5", quote: "require employers to audit automated hiring tools for bias and to inform applicants when such tools are used" },
      },
      {
        id: "rd-p-c1-1-q8",
        type: "attitude",
        difficulty: 5,
        prompt: "Which statement best reflects the writer's conclusion?",
        options: {
          A: "Using algorithms increases, rather than removes, employers' responsibility.",
          B: "Algorithms should make all hiring decisions.",
          C: "Errors by algorithms affect only individuals.",
          D: "Auditing has already solved the problem of bias.",
        },
        answer: "A",
        explanation: "The writer says delegation raises the stakes because errors can be replicated across thousands of applications.",
        evidence: { ref: "P6", quote: "If anything, it raises the stakes" },
        distractors: { D: "The writer notes auditing measures are still developing and fixing is harder than auditing." },
      },
    ],
  },
  {
    id: "rd-p-c1-2",
    title: "Cooling the Urban Heat Island",
    level: "C1",
    topic: "Cities & climate",
    passage: `On a still summer evening, the centre of a large city can be several degrees warmer than the surrounding countryside. This phenomenon, known as the urban heat island effect, arises from the way cities are built. Asphalt and concrete absorb solar radiation during the day and release it slowly after dark; tall buildings trap heat and block cooling winds; and vehicles, air conditioners and industry add heat of their own. Meanwhile, the trees and vegetation that would otherwise provide shade and cool the air through evaporation have often been cleared.

The consequences are not merely a matter of discomfort. Heat is among the deadliest forms of extreme weather, and its effects fall unevenly. Elderly people, outdoor workers and those living in poorly ventilated housing without air conditioning are most at risk. Crucially, the hottest neighbourhoods within a city are frequently its poorest, since lower-income districts tend to have less green space and denser, lower-quality buildings. Heat, in this sense, is not only an environmental issue but also one of social equity.

Cities have a range of tools at their disposal. Planting trees is perhaps the most widely promoted, and with good reason: mature trees can lower surface temperatures considerably and improve air quality at the same time. Yet trees take years to grow, require water and maintenance, and compete for space with underground pipes and cables. Cool roofs and pavements, which use reflective materials to absorb less heat, offer faster results, although some studies suggest that reflected light can increase the heat experienced by pedestrians at street level if such surfaces are applied without care.

Paradoxically, one of the most common individual responses to heat may worsen the problem. Air conditioning protects those who can afford it, but it expels heat into the street and consumes large amounts of electricity, which, if generated from fossil fuels, contributes to the very warming that makes cooling necessary. Policies that improve building design, through better insulation, shading and natural ventilation, can reduce this dependence.

Experts increasingly stress that no single measure will suffice. Effective strategies combine greenery, materials and design, and are targeted at the neighbourhoods and people most exposed. They also require attention to timing: emergency measures such as public cooling centres during heatwaves are essential, but they cannot substitute for the slower work of reshaping the urban fabric.

As heatwaves become more frequent and intense, the urban heat island is likely to move from the margins of city planning to its centre. How cities respond will reveal not only their technical capacity but also whose wellbeing they choose to prioritise.`,
    questions: [
      {
        id: "rd-p-c1-2-q1",
        type: "main_idea",
        difficulty: 4,
        prompt: "What is the main focus of the passage?",
        options: {
          A: "The causes and social impact of urban heat islands and ways to reduce them",
          B: "The benefits of air conditioning",
          C: "Why rural areas are colder than cities in winter",
          D: "How to build taller buildings safely",
        },
        answer: "A",
        explanation: "The passage explains causes, unequal consequences and a range of solutions to the urban heat island effect.",
        evidence: { ref: "P1", quote: "This phenomenon, known as the urban heat island effect, arises from the way cities are built." },
      },
      {
        id: "rd-p-c1-2-q2",
        type: "detail",
        difficulty: 3,
        prompt: "Which of the following is given as a cause of urban heat islands?",
        options: {
          A: "Materials that absorb heat and release it slowly",
          B: "Too many trees in city centres",
          C: "Strong winds between tall buildings",
          D: "Cold air from the countryside",
        },
        answer: "A",
        explanation: "Asphalt and concrete absorb solar radiation during the day and release it slowly after dark.",
        evidence: { ref: "P1", quote: "Asphalt and concrete absorb solar radiation during the day and release it slowly after dark" },
        distractors: { C: "Buildings block cooling winds rather than creating them." },
      },
      {
        id: "rd-p-c1-2-q3",
        type: "inference",
        difficulty: 5,
        prompt: "Why does the writer describe heat as an issue of social equity?",
        options: {
          A: "Poorer neighbourhoods are often hotter and their residents more vulnerable.",
          B: "Wealthy people suffer more from heat.",
          C: "Heat affects everyone equally.",
          D: "Governments charge for air conditioning.",
        },
        answer: "A",
        explanation: "The hottest neighbourhoods are often the poorest, with less green space and lower-quality housing.",
        evidence: { ref: "P2", quote: "the hottest neighbourhoods within a city are frequently its poorest" },
      },
      {
        id: "rd-p-c1-2-q4",
        type: "detail",
        difficulty: 4,
        prompt: "What disadvantage of planting trees is mentioned?",
        options: {
          A: "They take years to grow and need maintenance.",
          B: "They increase air pollution.",
          C: "They reflect too much sunlight.",
          D: "They are illegal in city centres.",
        },
        answer: "A",
        explanation: "Trees take years to grow, need water and maintenance, and compete for underground space.",
        evidence: { ref: "P3", quote: "Yet trees take years to grow, require water and maintenance" },
      },
      {
        id: "rd-p-c1-2-q5",
        type: "inference",
        difficulty: 5,
        prompt: "What concern about cool pavements is raised?",
        options: {
          A: "Reflected light might make streets hotter for pedestrians if used carelessly.",
          B: "They take longer than trees to have an effect.",
          C: "They absorb more heat than asphalt.",
          D: "They cannot be used on roofs.",
        },
        answer: "A",
        explanation: "Some studies suggest reflected light can increase heat at street level if such surfaces are applied without care.",
        evidence: { ref: "P3", quote: "reflected light can increase the heat experienced by pedestrians at street level" },
      },
      {
        id: "rd-p-c1-2-q6",
        type: "vocabulary",
        difficulty: 5,
        prompt: 'The word "Paradoxically" at the start of paragraph 4 signals that',
        options: {
          A: "a common solution may contribute to the problem it addresses",
          B: "the writer is about to give an example",
          C: "the following idea is widely accepted",
          D: "the writer is summarising the passage",
        },
        answer: "A",
        explanation: "Air conditioning protects people from heat but adds heat to the street and contributes to warming, which seems contradictory.",
        evidence: { ref: "P4", quote: "one of the most common individual responses to heat may worsen the problem" },
      },
      {
        id: "rd-p-c1-2-q7",
        type: "detail",
        difficulty: 4,
        prompt: "According to paragraph 5, what is true of emergency cooling centres?",
        options: {
          A: "They are necessary but cannot replace long-term changes.",
          B: "They are the most effective long-term solution.",
          C: "They are unnecessary in modern cities.",
          D: "They should replace tree planting.",
        },
        answer: "A",
        explanation: "Emergency measures are essential but cannot substitute for the slower work of reshaping the city.",
        evidence: { ref: "P5", quote: "they cannot substitute for the slower work of reshaping the urban fabric" },
      },
      {
        id: "rd-p-c1-2-q8",
        type: "attitude",
        difficulty: 5,
        prompt: "What does the final sentence imply?",
        options: {
          A: "Cities' responses to heat will show whose wellbeing they value.",
          B: "Technology alone will solve the heat problem.",
          C: "Heatwaves will soon become less common.",
          D: "City planning is not affected by heat.",
        },
        answer: "A",
        explanation: "The writer says the response will reveal not only technical capacity but whose wellbeing cities prioritise.",
        evidence: { ref: "P6", quote: "whose wellbeing they choose to prioritise" },
      },
    ],
  },
];
