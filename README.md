# Badb Clock 🕰️

An autism-friendly **visual countdown timer for transitions**, built for one particular kiddo who finds timers helpful for moving between activities.

## How it works

1. **Where are we going?** — pick a transition from big, friendly cards: the car, food, Granny's, school, home, bath, shower, bed, the park, the shops, or a walk.
   - Picking **Food** adds two extra steps: **Dinner or dessert?**, then **What are we having?** — a grid of hand-drawn pictures of her actual foods (square potato waffles, penne with nutritional yeast, pizza, square choco-puff cereal, granola with pink yoghurt, Snax, a bagel, the pink smoothie carton, yoghurt pots; dessert adds chocolate and ice cream). Ice cream only ever appears behind the Dessert door. The arrival close-up then shows her eating exactly what she picked.
2. **How long?** — pick a time (1–15 minutes).
3. **The countdown** — an animated character walks across a calm scene toward the destination as the time runs down. The default character is a hand-drawn cartoon avatar of Badb herself (`avatar.svg` — wavy golden hair, blue eyes, rosy cheeks, yellow scarf, duck hair clip), with emoji alternatives in the picker. A green progress bar shrinks alongside, and in the last 10 seconds everything gently shifts to "Nearly there!".
4. **Time's up** — the character arrives, a soft rising chime plays twice, and a calm sprinkle of stars celebrates the arrival.

While the countdown runs, a quiet music-box loop plays underneath (think kid-friendly elevator music — a slow C–Am–F–G waltz generated with the Web Audio API, so no audio files are needed and it works offline). The 🎵 button on the timer screen turns it off for quiet days, and the choice is remembered.

### Your own foods, from photos

On the food screen, **＋ Add a food** opens the camera: take a photo of the real food, optionally tap **🎨 Cartoon** to run it through an on-device posterise-and-outline filter (plain canvas code — no AI service, nothing uploaded), name it, and file it under Dinner, Dessert or Both. It then behaves exactly like the built-in foods, including being held in the avatar's hands on the arrival close-up. **✎ Edit foods** renames, re-files or removes them. Everything is stored on the device in IndexedDB — no accounts, no servers, works offline.

## Design principles

- **Predictable**: the same four steps every time, no surprises, no ads, no notifications.
- **Calm**: soft low-saturation colours, gentle animations, a friendly chime instead of a jarring alarm. Respects the system "reduce motion" setting.
- **Visual first**: the character's journey and the shrinking bar tell the story even before numbers make sense.
- **Big touch targets**: everything is tappable by small hands on a phone or tablet.

## Running it

It's a plain static web app — no build step, no dependencies.

- Open `index.html` in any browser, or
- Serve the folder (`python3 -m http.server`) and open it on a tablet, then use "Add to Home Screen" — it installs as a fullscreen app and works offline.

## Ideas for later

- Photos of the *real* car / Granny / school instead of emoji
- A recorded voice ("Two more minutes!") in a familiar voice
- Custom transitions added by the parent
- Gentle vibration cue on arrival (for noisy places)

## Rescue videos

The 🎬 **Videos** button on the home screen opens the instant player: import your own video files in a quiet moment, and each becomes a big thumbnail tile that plays fullscreen **instantly** — stored whole on the device, so nothing streams, buffers, or shows ads, even with no signal. Built for grabbing attention fast in the moments just before a meltdown. There's also a one-tap shortcut into the YouTube app's own downloads shelf (for YouTube Premium offline content, which Google keeps inside their app).
