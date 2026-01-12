#!/usr/bin/env node

/**
 * OpenAI API Test Script
 * 
 * Tests OpenAI API connection and demonstrates correct usage
 * Run: node scripts/openai-test.js
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Test 1: Simple Chat Completion
 */
async function testSimpleChat() {
  console.log('🧪 Test 1: Simple Chat Completion\n');
  
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // ✅ Valid model
      messages: [
        {
          role: "user",
          content: "Say hello in one sentence"
        }
      ],
      max_tokens: 50,
    });
    
    console.log('✅ Success!');
    console.log('Response:', response.choices[0].message.content);
    console.log('Tokens used:', response.usage.total_tokens);
    console.log('Cost: ~$' + (response.usage.total_tokens * 0.000002).toFixed(6));
    console.log('');
    
    return response;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Test 2: Bedtime Story (Your Example, Corrected)
 */
async function testBedtimeStory() {
  console.log('🧪 Test 2: Bedtime Story Generation\n');
  
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // ✅ Correct: gpt-3.5-turbo (not gpt-5.2)
      messages: [
        {
          role: "system",
          content: "You are a creative storyteller who writes short, engaging bedtime stories for children."
        },
        {
          role: "user",
          content: "Write a short bedtime story about a unicorn."
        }
      ],
      max_tokens: 300,
      temperature: 0.8, // More creative
    });
    
    const story = response.choices[0].message.content;
    
    console.log('✅ Success!');
    console.log('\n📖 Story:\n');
    console.log(story);
    console.log('\n' + '─'.repeat(60));
    console.log('Tokens used:', response.usage.total_tokens);
    console.log('Cost: ~$' + (response.usage.total_tokens * 0.000002).toFixed(6));
    console.log('');
    
    return story;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Test 3: Railway Data Analysis
 */
async function testRailwayAnalysis() {
  console.log('🧪 Test 3: Railway Data Analysis\n');
  
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI analyst for Africa Railways. Provide data-driven insights and actionable recommendations."
        },
        {
          role: "user",
          content: `Analyze this sample booking data and provide insights:
          
Bookings: 150 tickets sold today
Routes: Dar es Salaam → Kapiri Mposhi (45%), Nairobi → Mombasa (35%), Other (20%)
Classes: Economy (60%), Business (30%), First (10%)
Payment: AFC (70%), USD (20%), Local Currency (10%)

What are the key insights and recommendations?`
        }
      ],
      max_tokens: 400,
    });
    
    const analysis = response.choices[0].message.content;
    
    console.log('✅ Success!');
    console.log('\n📊 Analysis:\n');
    console.log(analysis);
    console.log('\n' + '─'.repeat(60));
    console.log('Tokens used:', response.usage.total_tokens);
    console.log('Cost: ~$' + (response.usage.total_tokens * 0.000002).toFixed(6));
    console.log('');
    
    return analysis;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Test 4: Streaming Response
 */
async function testStreaming() {
  console.log('🧪 Test 4: Streaming Response\n');
  
  try {
    const stream = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Count from 1 to 10 with a brief description of each number."
        }
      ],
      max_tokens: 200,
      stream: true, // Enable streaming
    });
    
    console.log('✅ Streaming response:\n');
    
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
      fullResponse += content;
    }
    
    console.log('\n\n' + '─'.repeat(60));
    console.log('Stream complete!');
    console.log('');
    
    return fullResponse;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 OpenAI API Test Suite for Africa Railways');
  console.log('═'.repeat(60));
  console.log('');
  
  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.error('');
    console.error('Please add your API key to .env file:');
    console.error('  echo "OPENAI_API_KEY=sk-proj-your-key-here" >> .env');
    console.error('');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('❌ Error: Invalid API key format');
    console.error('API key should start with "sk-" or "sk-proj-"');
    console.error('');
    process.exit(1);
  }
  
  console.log('✅ API key found');
  console.log('🔑 Key prefix:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
  console.log('');
  console.log('─'.repeat(60));
  console.log('');
  
  try {
    // Run tests
    const testArg = process.argv[2];
    
    switch (testArg) {
      case 'simple':
        await testSimpleChat();
        break;
      case 'story':
        await testBedtimeStory();
        break;
      case 'analysis':
        await testRailwayAnalysis();
        break;
      case 'stream':
        await testStreaming();
        break;
      case 'all':
      default:
        await testSimpleChat();
        await testBedtimeStory();
        await testRailwayAnalysis();
        await testStreaming();
        break;
    }
    
    console.log('═'.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review OPENAI_SETUP_GUIDE.md for best practices');
    console.log('  2. Run: node scripts/airtable-sync/chatgpt-analytics.js');
    console.log('  3. Set up usage limits in OpenAI dashboard');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ Test suite failed');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.status === 401) {
      console.error('💡 Tip: Check your API key is correct and active');
      console.error('   Visit: https://platform.openai.com/api-keys');
    } else if (error.status === 429) {
      console.error('💡 Tip: Rate limit exceeded. Wait a moment and try again');
    } else if (error.status === 500) {
      console.error('💡 Tip: OpenAI server error. Check status.openai.com');
    }
    
    console.error('');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  testSimpleChat,
  testBedtimeStory,
  testRailwayAnalysis,
  testStreaming,
};
