# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Ensure Backend is Running
```bash
# Backend should be running at:
http://localhost:8080

# Test with:
curl http://localhost:8080/actuator/health
```

### Step 2: Start Frontend
```bash
npm run dev
```

### Step 3: Open Browser
```
http://localhost:5173
```

---

## 🧪 Test the Complete Flow

### Setup: Create Two Users

#### User 1: Customer
1. Open browser: `http://localhost:5173`
2. Click **"Sign Up"**
3. Select **"Customer"** tab
4. Fill in:
   - Email: `customer@test.com`
   - Password: `password123`
   - Name: `John Customer`
   - Phone: `+1-555-0001`
   - Address: `123 Main St`
   - Age: `30`
5. Click **"Create Account"**

#### User 2: Sales Person (New Incognito Window)
1. Open **new incognito window**: `http://localhost:5173`
2. Click **"Sign Up"**
3. Select **"Salesperson"** tab
4. Fill in:
   - Email: `sales@test.com`
   - Password: `password123`
   - Phone: `+1-555-0002`
   - Date of Joining: `2024-01-01`
   - Expertise: Select **SUV**, **Sedan**
5. Click **"Create Account"**

---

## 💬 Test Real-Time Chat

### In Customer Window:
1. You'll see the landing page
2. Click **"Start AI Search"** button
3. Chatbot opens with greeting
4. Answer questions:
   - **"Yes, let's go!"**
   - Select **SUV**
   - Enter budget: `50000`
   - Select **"1-3 months"**
   - Select **Call**
5. Bot says: "Perfect! I've curated a list..."
6. Wait for: "✨ Perfect! I'm now connecting you with a specialist..."
7. **Wait for sales person to join** (you'll see green notification)

### In Sales Person Window:
1. You'll see the **Sales Dashboard**
2. Look for **"Active Opportunities"** section
3. You should see **1 deal card** with John Customer
4. **Click on the deal card**
5. Chat modal opens
6. Type: `"Hi John, I see you're interested in an SUV. I can help!"`
7. Press **Send**

### Back in Customer Window:
1. You should see the sales person's message **instantly**
2. Type: `"Great! What SUVs do you have in my budget?"`
3. Press **Send**
4. Continue conversation...

---

## 🎯 What to Look For

### ✅ Success Indicators

#### Customer Side:
- ✅ Chatbot completes all questions
- ✅ "Connecting you with specialist" message appears
- ✅ Green notification when sales person joins
- ✅ Real-time messages appear instantly
- ✅ Can type and send messages

#### Sales Person Side:
- ✅ Dashboard loads with statistics
- ✅ "Active Opportunities" shows 1 deal
- ✅ Deal card shows customer name and vehicle interest
- ✅ Click opens chat modal
- ✅ Can see chat history
- ✅ Can send messages in real-time

### 🔍 Debug: Browser Console
Press **F12** to open console and check:
- No red errors
- WebSocket connection successful
- API calls returning 200 OK
- Messages being sent/received

---

## 🎨 Visual Clues

### Customer Chatbot:
- **Bot messages**: Dark gray bubbles on left
- **Your messages**: Cyan bubbles on right
- **System messages**: Green highlighted center
- **Sales person messages**: Purple bubbles on left with name

### Sales Dashboard:
- **Deal cards**: Show customer info, vehicle, budget
- **Unread badge**: Red dot on cards with new messages
- **Chat modal**: Opens when clicking deal card
- **Your messages**: Cyan bubbles on right
- **Customer messages**: Dark gray bubbles on left

---

## 🐛 Troubleshooting

### Problem: "Network Error"
**Solution:**
```bash
# Check if backend is running:
curl http://localhost:8080/actuator/health

# Should return: {"status":"UP"}
```

### Problem: "WebSocket connection failed"
**Solution:**
1. Check backend WebSocket config
2. Refresh page (auto-reconnect will trigger)
3. Check browser console for specific error

### Problem: Deal not appearing in sales dashboard
**Solution:**
1. Refresh sales dashboard page
2. Check browser console for API errors
3. Verify customer ID was captured during login
4. Check backend logs for deal creation

### Problem: Messages not appearing
**Solution:**
1. Check if both users are connected (browser console)
2. Verify WebSocket connection (should see "✅ WebSocket Connected")
3. Try sending message from other side
4. Refresh both pages and try again

---

## 📱 Test on Mobile

The UI is responsive! Test on your phone:
1. Find your computer's IP address
2. On same WiFi, open: `http://YOUR_IP:5173`
3. Test the complete flow

---

## 🎉 Expected Result

You should have:
1. ✅ Smooth chatbot conversation
2. ✅ Deal created automatically
3. ✅ Sales person sees deal immediately
4. ✅ Real-time bidirectional chat working
5. ✅ No errors in console
6. ✅ Beautiful UI with smooth animations

---

## 📹 Record a Demo

Everything working? Record your screen to show:
1. Customer signup
2. Chatbot Q&A
3. Deal creation
4. Sales person login
5. Chat conversation
6. Real-time message sync

---

## 🎓 Next Level Testing

### Advanced Scenarios:
1. **Multiple customers** - Create 5 customers, see all in sales dashboard
2. **Multiple sales people** - Test deal distribution
3. **Concurrent chats** - Sales person handling 3 customers
4. **Network interruption** - Disconnect WiFi, reconnect (auto-recovery)
5. **Long messages** - Test with paragraphs
6. **Fast typing** - Send multiple messages quickly

---

## 💡 Pro Tips

- Keep browser console open during testing
- Use incognito windows for multiple users
- Clear localStorage if you need fresh start: `localStorage.clear()`
- Backend logs show deal creation and WebSocket events
- MongoDB shows chat history
- MySQL shows user and deal records

---

## 🎊 Success!

If you can chat in real-time between customer and sales person, **congratulations!** Your full-stack integration is working perfectly!

**Questions?** Check `BACKEND_INTEGRATION.md` for detailed docs.

---

## 🔗 Quick Links

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui.html (if enabled)

---

**Built with ❤️ using React, Spring Boot, WebSocket, and Tekion magic!**
