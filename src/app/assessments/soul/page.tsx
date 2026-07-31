"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Heart, ArrowLeft, ArrowRight, Save, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  type: "radio" | "text" | "multiselect";
  options?: { value: string; label: string }[];
  section: string;
  sectionIndex: number;
  sensitive?: boolean;
}

// All 264 questions organized by section
const allQuestions: Question[] = [
  // Section 1: Core Identity (20 questions)
  { id: "ci1", text: "What is your full name?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci2", text: "What name do you prefer to be called professionally?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci3", text: "What name do you prefer to be called personally?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci4", text: "Are there any nicknames, titles, or relational names that matter to you?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci5", text: "What pronouns do you use?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci6", text: "Where are you based?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci7", text: "What communities, cultures, regions, or life experiences have shaped how you see the world?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci8", text: "How do you currently describe who you are in one sentence?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci9", text: "How do you wish people understood who you are beyond your title?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci10", text: "What parts of your identity feel most central to your work?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci11", text: "What season of life are you currently in?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci12", text: "What are you learning right now?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci13", text: "What are you releasing right now?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci14", text: "What are you building right now?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci15", text: "What feels newly clear to you?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci16", text: "What feels unfinished or still becoming?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci17", text: "What has changed in you over the last 12 months?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci18", text: "What are you no longer willing to carry?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci19", text: "What are you finally ready to say out loud?", type: "text", section: "Core Identity", sectionIndex: 1 },
  { id: "ci20", text: "What words would you use to describe this chapter of your life?", type: "text", section: "Core Identity", sectionIndex: 1 },

  // Section 2: Origin Story (34 questions)
  { id: "os1", text: "What were you like as a child?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os2", text: "What did people often notice about you when you were young?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os3", text: "What did you love before the world told you what was practical?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os4", text: "What did you understand early that other people seemed to miss?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os5", text: "What did you have to become good at in order to survive, belong, succeed, or be loved?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os6", text: "What role did you often play in your family or community? (caretaker, achiever, rebel, peacekeeper, invisible one, truth-teller, fixer, performer, observer, or something else?)", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os7", text: "What did you learn too early?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os8", text: "What did you have to unlearn later?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os9", text: "What part of your younger self still walks with you in your work today?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os10", text: "What are the major life events that shaped who you are?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os11", text: "Which experiences broke something open in you?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os12", text: "Which experiences refined you?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os13", text: "Which experiences gave you wisdom you could not have learned any other way?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os14", text: "What losses have shaped your worldview?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os15", text: "What victories have shaped your confidence?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os16", text: "What betrayals, disappointments, or disruptions changed your standards?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os17", text: "What moments taught you resilience?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os18", text: "What moments taught you surrender?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os19", text: "What moments taught you discernment?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os20", text: "What moments taught you that your work mattered?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os21", text: "What experiences do you rarely talk about but know deeply shaped you?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os22", text: "Are there stories you are comfortable sharing publicly?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os23", text: "Are there stories that are only for private context and should not be used publicly?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os24", text: "Are there stories that should never be referenced by AI-generated content?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os25", text: "Was there a specific moment when your life or work changed direction?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os26", text: "What happened?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os27", text: "What did that moment require from you?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os28", text: "What did it reveal?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os29", text: "What did you lose?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os30", text: "What did you gain?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os31", text: "What did you finally understand?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os32", text: "What did you stop pretending?", type: "text", section: "Origin Story", sectionIndex: 2, sensitive: true },
  { id: "os33", text: "What did you decide from that moment forward?", type: "text", section: "Origin Story", sectionIndex: 2 },
  { id: "os34", text: "How does that turning point still inform your work today?", type: "text", section: "Origin Story", sectionIndex: 2 },

  // Section 3: Calling, Purpose, and Sacred Why (23 questions)
  { id: "cp1", text: "Why do you do the work you do?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp2", text: "What problem can you not unsee?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp3", text: "What pain in the world keeps calling your attention?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp4", text: "What transformation do you feel uniquely assigned to help others experience?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp5", text: "Who are you here to serve?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp6", text: "Why do those people matter to you?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp7", text: "What do you believe is possible for them that they may not yet believe for themselves?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp8", text: "What do you want people to feel in your presence?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp9", text: "What do you want people to remember after working with you?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp10", text: "What would still matter to you even if no one applauded?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp11", text: "What is your current mission?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp12", text: "What mission have you outgrown?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp13", text: "What mission is emerging?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp14", text: "What do you believe your work is really about beneath the surface?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp15", text: "What is the deeper transformation underneath your visible offer or service?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp16", text: "What did success used to mean that no longer fits?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp17", text: "What does aligned success feel like in your body, schedule, relationships, and work?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp18", text: "What would success look like if it were quiet, sustainable, and deeply true?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp19", text: "What metrics matter to you?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp20", text: "What metrics do not matter as much as people think they should?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp21", text: "What are you unwilling to sacrifice for success?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3, sensitive: true },
  { id: "cp22", text: "What kind of success would feel hollow?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },
  { id: "cp23", text: "What kind of success would feel holy, grounded, meaningful, or complete?", type: "text", section: "Calling, Purpose, and Sacred Why", sectionIndex: 3 },

  // Section 4: Values and Standards (30 questions)
  { id: "vs1", text: "What are your top 5 to 10 core values?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs2", text: "For each value, what does it mean to you specifically?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs3", text: "How do those values show up in your work?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs4", text: "How do those values show up in your relationships?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs5", text: "Which value do you protect most fiercely?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs6", text: "Which value has cost you something?", type: "text", section: "Values and Standards", sectionIndex: 4, sensitive: true },
  { id: "vs7", text: "Which value did you have to fight to reclaim?", type: "text", section: "Values and Standards", sectionIndex: 4, sensitive: true },
  { id: "vs8", text: "Which value do people often misunderstand in you?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs9", text: "Which value do you want your clients to embody more fully?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs10", text: "What values should your AI always reflect when creating in your voice?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs11", text: "What are your personal non-negotiables?", type: "text", section: "Values and Standards", sectionIndex: 4, sensitive: true },
  { id: "vs12", text: "What are your professional non-negotiables?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs13", text: "What are your relational non-negotiables?", type: "text", section: "Values and Standards", sectionIndex: 4, sensitive: true },
  { id: "vs14", text: "What are your spiritual, ethical, or moral non-negotiables?", type: "text", section: "Values and Standards", sectionIndex: 4, sensitive: true },
  { id: "vs15", text: "What will you no longer tolerate?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs16", text: "What will you no longer over-explain?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs17", text: "What will you no longer shrink to preserve?", type: "text", section: "Values and Standards", sectionIndex: 4, sensitive: true },
  { id: "vs18", text: "What boundaries are essential for your health, peace, energy, or integrity?", type: "text", section: "Values and Standards", sectionIndex: 4, sensitive: true },
  { id: "vs19", text: "What do people need to understand before working closely with you?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs20", text: "What should your AI never recommend, imply, or create on your behalf?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs21", text: "What does integrity mean to you?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs22", text: "How do you know when something is out of alignment?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs23", text: "What compromises are dangerous for you?", type: "text", section: "Values and Standards", sectionIndex: 4, sensitive: true },
  { id: "vs24", text: "What kinds of shortcuts do you refuse to take?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs25", text: "What kinds of marketing, sales, leadership, or communication tactics do you reject?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs26", text: "What does ethical influence look like to you?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs27", text: "What does manipulation look like to you?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs28", text: "What does trust require?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs29", text: "What damages trust?", type: "text", section: "Values and Standards", sectionIndex: 4 },
  { id: "vs30", text: "What restores trust?", type: "text", section: "Values and Standards", sectionIndex: 4 },

  // Section 5: Beliefs and Worldview (35 questions)
  { id: "bw1", text: "What do you believe about people?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw2", text: "What do you believe about transformation?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw3", text: "What do you believe about healing, growth, change, or becoming?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw4", text: "What do you believe about suffering?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5, sensitive: true },
  { id: "bw5", text: "What do you believe about resilience?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw6", text: "What do you believe about responsibility?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw7", text: "What do you believe about purpose?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw8", text: "What do you believe about faith, spirituality, meaning, or inner guidance?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw9", text: "What do you believe about leadership?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw10", text: "What do you believe about love?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw11", text: "What do you believe about fear?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw12", text: "What do you believe about failure?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw13", text: "What do you believe about success?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw14", text: "What do you believe people often get wrong about your area of work?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw15", text: "What truth do you wish more people were brave enough to live?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw16", text: "What do you believe that goes against common advice in your industry?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw17", text: "What popular belief do you disagree with?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw18", text: "What phrase, trend, or framework makes you inwardly roll your eyes?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw19", text: "What are people oversimplifying?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw20", text: "What are people overcomplicating?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw21", text: "What are people avoiding?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw22", text: "What are people calling strategy that is actually fear?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw23", text: "What are people calling wisdom that is actually resignation?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw24", text: "What are people calling kindness that is actually self-abandonment?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw25", text: "What is one truth you would say even if it made the room uncomfortable?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw26", text: "Do you have a spiritual, religious, philosophical, or metaphysical foundation that shapes your work?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw27", text: "What language feels aligned when describing this foundation?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw28", text: "What language feels inaccurate, performative, or off-limits?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw29", text: "Are there sacred texts, teachers, traditions, or practices that influence you?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw30", text: "How should those influences be referenced?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw31", text: "Are there any beliefs you want clearly included in your soul.md?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw32", text: "Are there any beliefs you want handled gently or privately?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5, sensitive: true },
  { id: "bw33", text: "Are there any spiritual claims your AI should avoid making?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw34", text: "What role does intuition, prayer, discernment, inner wisdom, or contemplation play in your decisions?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },
  { id: "bw35", text: "How do you distinguish true guidance from fear, ego, urgency, or pressure?", type: "text", section: "Beliefs and Worldview", sectionIndex: 5 },

  // Section 6: Voice and Communication Style (30 questions)
  { id: "vc1", text: "How do you naturally speak when you are relaxed?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc2", text: "How do you sound when you are teaching?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc3", text: "How do you sound when you are encouraging someone?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc4", text: "How do you sound when you are lovingly confronting someone?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc5", text: "How do you sound when you are angry but grounded?", type: "text", section: "Voice and Communication Style", sectionIndex: 6, sensitive: true },
  { id: "vc6", text: "How do you sound when you are moved emotionally?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc7", text: "How do you sound when you are speaking from conviction?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc8", text: "What words or phrases do you use often?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc9", text: "What words or phrases would people recognize as \"so you\"?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc10", text: "What do people often say about the way you communicate?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc11", text: "Which tones feel most natural to you? (warm, direct, poetic, grounded, fierce, tender, strategic, spiritual, humorous, etc.)", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc12", text: "Which tones feel inauthentic or forced?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc13", text: "How do you want people to feel when they read your words?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc14", text: "What kind of language feels too corporate or cold?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc15", text: "What kind of language feels too casual or unprofessional?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc16", text: "What kind of language feels too trendy or performative?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc17", text: "What kind of language feels timeless and true?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc18", text: "How do you balance authority with humility?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc19", text: "How do you balance clarity with nuance?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc20", text: "How do you challenge without shaming?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc21", text: "How do you comfort without bypassing?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc22", text: "How do you inspire without hyping?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc23", text: "How do you teach without lecturing?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc24", text: "How do you sell without manipulating?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc25", text: "How do you lead without dominating?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc26", text: "How do you hold space without disappearing?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc27", text: "How do you show up fully without performing?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc28", text: "How do you stay accessible without diluting your message?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc29", text: "How do you stay sharp without becoming harsh?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },
  { id: "vc30", text: "How do you stay open without becoming vague?", type: "text", section: "Voice and Communication Style", sectionIndex: 6 },

  // Section 7: Emotional Texture and Presence (27 questions)
  { id: "et1", text: "What emotions are you comfortable expressing?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et2", text: "What emotions do you tend to hold back?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7, sensitive: true },
  { id: "et3", text: "What emotions show up most in your work?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et4", text: "What emotions do you help others navigate?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et5", text: "What emotions signal that something is misaligned?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et6", text: "What emotions signal that something is deeply right?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et7", text: "What emotions do you consider sacred?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et8", text: "What emotions do you consider warning signs?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et9", text: "How do you process grief, anger, or disappointment?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7, sensitive: true },
  { id: "et10", text: "How do you process joy, excitement, or success?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et11", text: "What emotions are you still learning to feel?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7, sensitive: true },
  { id: "et12", text: "What emotions are you healing your relationship with?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7, sensitive: true },
  { id: "et13", text: "How do you want people to feel when they encounter your work?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et14", text: "How do you want people to feel when they work with you directly?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et15", text: "What emotional states support your best work?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et16", text: "What emotional states diminish your capacity?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et17", text: "How do you restore yourself emotionally?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et18", text: "How do you know when you are emotionally depleted?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et19", text: "How do you know when you are emotionally resourced?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et20", text: "What is your relationship with vulnerability?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7, sensitive: true },
  { id: "et21", text: "When do you feel most alive?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et22", text: "When do you feel most at peace?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et23", text: "When do you feel most like yourself?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et24", text: "What presence do you bring to difficult conversations?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et25", text: "What presence do you bring to celebratory moments?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et26", text: "What presence do you bring to everyday interactions?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },
  { id: "et27", text: "How do you want to be remembered?", type: "text", section: "Emotional Texture and Presence", sectionIndex: 7 },

  // Section 8: Client Transformation (28 questions)
  // Who You Serve (ct1-ct11)
  { id: "ct1", text: "Who are your people? Describe them in detail.", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct2", text: "What do they have in common?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct3", text: "What are they carrying when they come to you?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct4", text: "What are they hoping for?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct5", text: "What are they afraid of?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct6", text: "What have they already tried?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct7", text: "What do they believe about themselves when they first encounter you?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct8", text: "What do they believe about their situation?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct9", text: "What do they believe about what is possible?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct10", text: "What do they need to hear but have not been told?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct11", text: "What do they need to feel but have not felt safe enough to feel?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  // The Before State (ct12-ct21)
  { id: "ct12", text: "What does life look like for them before working with you?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct13", text: "What are they tolerating?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct14", text: "What are they pretending not to know?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct15", text: "What are they exhausted by?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct16", text: "What are they longing for?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct17", text: "What patterns keep repeating for them?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct18", text: "What are they ready to leave behind?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct19", text: "What are they afraid will never change?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct20", text: "What are they secretly hoping is true?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct21", text: "What do they need permission to do, feel, or believe?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  // The After State (ct22-ct31)
  { id: "ct22", text: "What becomes possible for them after working with you?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct23", text: "How do they think differently?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct24", text: "How do they speak differently?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct25", text: "How do they decide differently?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct26", text: "How do they relate to themselves differently?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct27", text: "How do they relate to others differently?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct28", text: "What do they stop tolerating?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct29", text: "What do they start claiming?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct30", text: "What do they finally understand about themselves?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct31", text: "What do they finally trust?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  // Your Role in Transformation (ct32-ct39)
  { id: "ct32", text: "What role do you play in their transformation?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct33", text: "What do you help them see?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct34", text: "What do you help them name?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct35", text: "What do you help them release?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct36", text: "What do you help them build?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct37", text: "What do you help them remember?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct38", text: "What do you hold space for?", type: "text", section: "Client Transformation", sectionIndex: 8 },
  { id: "ct39", text: "What do you refuse to do for them?", type: "text", section: "Client Transformation", sectionIndex: 8 },

  // Section 9: Story Library (25 questions)
  // Personal Stories (sl1-sl15)
  { id: "sl1", text: "Tell me about a moment that changed everything for you.", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl2", text: "Tell me about a time you had to begin again.", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl3", text: "Tell me about a moment when you were deeply misunderstood.", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl4", text: "Tell me about a time you surprised yourself.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl5", text: "Tell me about a failure that became a gift.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl6", text: "Tell me about a person who saw something in you that you could not see in yourself.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl7", text: "Tell me about a time you had to stand alone.", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl8", text: "Tell me about a time you chose alignment over approval.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl9", text: "Tell me about a moment of clarity that arrived unexpectedly.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl10", text: "Tell me about a time you had to let go of something you thought you needed.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl11", text: "Tell me about a time you created something that scared you.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl12", text: "Tell me about a time you showed up when it would have been easier to hide.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl13", text: "Tell me about a moment when you knew you were exactly where you were meant to be.", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl14", text: "Tell me about a time you had to forgive yourself.", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl15", text: "Tell me about a time you witnessed someone else transform.", type: "text", section: "Story Library", sectionIndex: 9 },
  // Protected Stories and Sensitive Context (sl16-sl25)
  { id: "sl16", text: "Are there stories that are private context only?", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl17", text: "What topics are off-limits for public storytelling?", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl18", text: "What names, dates, or details should be omitted from public versions of your stories?", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl19", text: "What stories should AI never reference or allude to?", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl20", text: "What stories are okay to reference in general terms but not in detail?", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl21", text: "What stories are central to your message and should be told often?", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl22", text: "What stories are still being written and should be handled gently?", type: "text", section: "Story Library", sectionIndex: 9, sensitive: true },
  { id: "sl23", text: "What stories demonstrate your values in action?", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl24", text: "What stories demonstrate your expertise without you having to claim it?", type: "text", section: "Story Library", sectionIndex: 9 },
  { id: "sl25", text: "What stories help people trust you before they know you?", type: "text", section: "Story Library", sectionIndex: 9 },
];

const sections = [
  "Core Identity",
  "Origin Story",
  "Calling, Purpose, and Sacred Why",
  "Values and Standards",
  "Beliefs and Worldview",
  "Voice and Communication Style",
  "Emotional Texture and Presence",
  "Client Transformation",
  "Story Library",
];

export default function SoulAssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem("soul-assessment");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setCurrentQuestion(parsed.currentQuestion || 0);
        setLastSaved(new Date(parsed.savedAt));
      } catch {
        // Invalid saved data, start fresh
      }
    }
  }, []);

  // Autosave
  const saveProgress = useCallback(() => {
    setIsSaving(true);
    const data = {
      answers,
      currentQuestion,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("soul-assessment", JSON.stringify(data));
    setTimeout(() => {
      setLastSaved(new Date());
      setIsSaving(false);
    }, 500);
  }, [answers, currentQuestion]);

  useEffect(() => {
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [answers, currentQuestion, saveProgress]);

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [allQuestions[currentQuestion].id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < allQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentQ = allQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / allQuestions.length) * 100;
  const currentSection = currentQ.section;
  const sectionQuestions = allQuestions.filter((q) => q.section === currentSection);
  const sectionProgress =
    ((sectionQuestions.findIndex((q) => q.id === currentQ.id) + 1) /
      sectionQuestions.length) *
    100;

  if (isComplete) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-[#7b6b8d]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#7b6b8d]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#7b6b8d]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
                Soul Assessment Complete!
              </h1>
              <p className="text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 mb-6">
                Thank you for completing the Soul Assessment. Your responses have been
                saved and will contribute to your overall LifeCharter Alignment Score.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/assessments/brain">
                  <Button variant="primary">
                    Continue to Brain Assessment
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="secondary">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-[#1a2b4a] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#7b6b8d]/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#e8e4f0]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Soul Assessment</h1>
              <p className="text-sm text-[#e8e4f0]">Core Identity & Purpose</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {currentQuestion + 1} of {allQuestions.length}
              </span>
            </div>
            <Progress value={progress} variant="lavender" />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="border-[#7b6b8d]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#7b6b8d]">
                {currentQ.section}
              </span>
              <div className="flex items-center gap-2 text-sm text-[#b8a898]">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : lastSaved ? "Saved" : "Not saved"}
              </div>
            </div>
            <div className="mt-2">
              <Progress value={sectionProgress} variant="lavender" className="h-1" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3">
              {currentQ.sensitive && (
                <div className="flex items-center gap-1 text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded">
                  <Shield className="w-4 h-4" />
                  <span>Private</span>
                </div>
              )}
            </div>
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {currentQ.text}
            </h2>

            {currentQ.type === "text" && (
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={5}
                className="w-full p-4 rounded-xl border-2 border-[#c9a227]/20 focus:border-[#7b6b8d] focus:ring-2 focus:ring-[#7b6b8d]/20 outline-none resize-none bg-white dark:bg-[#1a1a2e] text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-[#c9a227]/20">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
              >
                {currentQuestion === allQuestions.length - 1 ? "Complete" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {sections.map((section) => {
            const sectionQs = allQuestions.filter((q) => q.section === section);
            const answeredQs = sectionQs.filter((q) => answers[q.id]).length;
            const isCurrent = section === currentSection;
            return (
              <div
                key={section}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? "border-[#7b6b8d] bg-[#7b6b8d]/5"
                    : "border-[#c9a227]/20"
                }`}
              >
                <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {section}
                </p>
                <p className="text-xs text-[#b8a898] mt-1">
                  {answeredQs} of {sectionQs.length} answered
                </p>
                <div className="mt-2">
                  <Progress
                    value={(answeredQs / sectionQs.length) * 100}
                    variant="lavender"
                    className="h-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
