# FF-Express-Supabase - Countries Visited

A small Express app that records people's visited countries in a **Supabase** Postgres database using **Prisma**, then shows:

- a **form** for a person's name, age, countries visited, and places they want to visit
- a **toggleable map** that switches between visited and wanted destinations
- a **bar chart** of the five countries with the most visits
- a **doughnut chart** grouping visited-country counts by continent, plus overall progress across the destination catalog
- **badges** for country milestones, all-country completion, and continent visits

---

## Quick Start

### 1. Get your database connection string

1. In your Supabase project, click **Connect** at the top of the dashboard.
2. Copy the **Session pooler** connection string (port **5432**).
3. Replace `[YOUR-PASSWORD]` with your database password.

> Use a password with only letters and numbers. Special characters break the connection string.

### 2. Create your `.env` file

Copy `.env.example` to a new file named `.env` and paste your string:

```
DATABASE_URL="postgresql://postgres.abcdefgh:MyPassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

> `.env` is in `.gitignore`. **Never commit it to GitHub**, because it contains your password.

### 3. Install, create the tables, add the colors, and run

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm start
```

- `migrate dev` creates the `Person`, `Color`, and `PersonColor` tables
- `db:seed` fills the `Color` table with the 7 rainbow colors (used by the [relational example](#relational-example-color--personcolor))

Open http://localhost:3000 and add a few colors, then click **Dashboard**.

---

## Project Structure

```
expresssupaprisma/
├── app.js               # Database connection, Express app, and all the routes
├── prisma/
│   ├── schema.prisma    # Person, Color, and PersonColor models (your tables)
│   ├── seed.js          # Fills the Color table with the rainbow colors
│   └── migrations/      # Created by "prisma migrate dev" - commit this folder
├── prisma.config.js     # Tells the Prisma CLI where the schema + database are
├── views/
│   ├── index.hbs        # The form
│   ├── dashboard.hbs    # Chart + rainbow + people list
│   ├── relational-index.hbs      # Relational form (colors from the Color table)
│   ├── relational-dashboard.hbs  # Relational dashboard
│   ├── layout.hbs       # Page wrapper used by every view
│   └── partials/        # Header (nav links) and footer
├── public/stylesheets/style.css
├── .env.example         # Template for your .env file
└── package.json
```

---

## Connecting to the Database: top of `app.js`

```javascript
require('dotenv').config(); // loads DATABASE_URL from the .env file
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

After this, every route can use `prisma.person` to work with the `Person` table.

---

## The Model: `prisma/schema.prisma`

```prisma
model Person {
  id        Int      @id @default(autoincrement())
  name      String
  color     String
  createdAt DateTime @default(now())
}
```

- `@id @default(autoincrement())`: each person gets an id automatically (1, 2, 3...)
- `String`: required text
- `@default(now())`: the date and time is filled in when the row is created

**Changed the model?** Run `npx prisma migrate dev --name describe-your-change` to update the table.

---

## The Routes: `app.js`

| Route | What it does |
|---|---|
| `GET /` | Shows the form |
| `POST /` | Saves a person, then redirects to the dashboard |
| `GET /dashboard` | Counts country visits and shows the top-five and country-progress charts |

### Saving a person

```javascript
await prisma.person.create({
  data: { name: name, color: color }
});
```

### Getting everyone

```javascript
const people = await prisma.person.findMany({
  orderBy: { createdAt: 'desc' }   // newest first
});
```

### Counting each color

A loop inside a loop: for each rainbow color, count the people who picked it.

```javascript
const counts = [];
for (let color of COLORS) {
  let count = 0;
  for (let person of people) {
    if (person.color === color) {
      count = count + 1;
    }
  }
  counts.push({ color: color, count: count });
}
// [{ color: 'red', count: 3 }, { color: 'orange', count: 0 }, ...]
```

---

## The Dashboard: `views/dashboard.hbs`

The home page places the dashboard below the form and map, so scroll down to see the charts and badges. The map toggles between countries people have visited and countries they want to visit; clicking a country adds it to the currently selected list. The dashboard displays the five most visited countries in a vertical stacked bar chart grouped by age (0-17, 18-34, 35-64, and 65+). Its doughnut has one slice per continent plus a gray remainder for destinations not yet visited. Each continent's legend entry shows its visited/total count, and the summary shows overall progress across the destination catalog. Badges track first-country and 5, 10, 15, 25, 50, and 100-country milestones, visiting every destination, visiting each continent, and unlocking all seven continents.

The country catalog provides the denominator, including Antarctica as a selectable destination, while the bundled `public/countries.geojson` supplies continent metadata through each feature's `CONTINENT` property. No continent column is needed in the database. Run `npm run db:seed` to add Antarctica to an existing database.

Hovering over a map country opens its facts panel; clicking it adds that country to the list selected by the map toggle. Capital, native name, languages, and currencies are bundled in `public/country-facts.json`, keyed by ISO alpha-3 country code; they do not need to be stored in Supabase. Population estimates come from the map data, and area is calculated approximately from map boundaries. The bundled reference facts are adapted from [Annexare Countries](https://github.com/annexare/Countries) under the MIT license; see [data/annexare-countries-MIT.txt](./data/annexare-countries-MIT.txt).

Visited and wanted destinations are stored separately. Run `npm run db:migrate` after updating to create the wanted-country relation.

---

## Relational Example: Color + PersonColor

The first example stores the color as text (`"blue"`) in every `Person` row. The relational example splits the data into **two tables** linked by a **foreign key**. The original `Person` example is unchanged, and both run side by side.

```
┌──────────────────────┐          ┌──────────────────────────┐
│ Color                │          │ PersonColor              │
├──────────────────────┤          ├──────────────────────────┤
│ id    (PK)           │◄────┐    │ id        (PK)           │
│ name  "red"          │     └────│ colorId   (FK → Color.id)│
│ hex   "#FF0000"      │   1 : N  │ name                     │
└──────────────────────┘          │ createdAt                │
                                  └──────────────────────────┘
```

**Color** (filled in once by `npm run db:seed`)

| id | name   | hex     |
|----|--------|---------|
| 1  | red    | #FF0000 |
| 5  | blue   | #0000FF |
| …  | …      | …       |

**PersonColor** (one row per form submission)

| id | name  | colorId | means            |
|----|-------|---------|------------------|
| 1  | Ana   | 5       | Ana likes blue   |
| 2  | Ben   | 1       | Ben likes red    |
| 3  | Carla | 5       | Carla likes blue |

### Key ideas

- **Primary key (PK):** `id` uniquely identifies each row.
- **Foreign key (FK):** `PersonColor.colorId` stores the `id` of a row in `Color`, not the color's name.
- **One-to-many:** one color (blue) can have many people (Ana, Carla). Each person has exactly one color.
- **No repeated data:** each color's name and hex code is stored once. Change it in one place and every linked person sees the change.
- **Integrity:** the database won't allow a `colorId` that doesn't exist in `Color`, and it won't let you delete a color that people still point to.

### The models

```prisma
model Color {
  id     Int           @id @default(autoincrement())
  name   String        @unique
  hex    String
  people PersonColor[] // all the people who picked this color (not a real column)
}

model PersonColor {
  id        Int      @id @default(autoincrement())
  name      String
  colorId   Int      // foreign key: stores the id of a Color
  color     Color    @relation(fields: [colorId], references: [id])
  createdAt DateTime @default(now())
}
```

- `colorId` is the **real column** in the database.
- `color` and `people` are **relation fields**. They aren't columns. Prisma uses them to follow the link in either direction.
- `@relation(fields: [colorId], references: [id])` means "`PersonColor.colorId` matches `Color.id`".

### The routes

| Route | What it does |
|---|---|
| `GET /relational` | Loads colors from the `Color` table into the dropdown |
| `POST /relational` | Saves a `PersonColor` with a `colorId` |
| `GET /relational/dashboard` | Joins people to their color and counts people per color |
| `POST /relational/people/:id/delete` | Deletes one `PersonColor` |

### The dropdown sends an id, not a name

```handlebars
<option value="{{this.id}}">{{this.name}}</option>
```

```javascript
await prisma.personColor.create({
  data: { name: name, colorId: colorId }
});
```

### Joining tables with `include`

```javascript
const people = await prisma.personColor.findMany({
  include: { color: true }   // also get the linked Color row
});
// [{ id: 1, name: 'Ana', colorId: 5, color: { id: 5, name: 'blue', hex: '#0000FF' } }, ...]
```

In the template, follow the link with a dot: `{{this.color.name}}`, `{{this.color.hex}}`.

### Counting with `_count` (no loop inside a loop)

```javascript
const colors = await prisma.color.findMany({
  include: { _count: { select: { people: true } } }
});
// [{ id: 1, name: 'red', hex: '#FF0000', _count: { people: 3 } }, ...]
```

Compare this with the nested loop in the first example: here the database does the counting.

---

## Deploying to Render

1. Push to GitHub. Make sure `.env` is **not** in the repo and `prisma/migrations/` **is**.
2. In Render, create a **Web Service** from your repo:
   - **Build Command:** `npm install && npx prisma migrate deploy && npm run db:seed`
   - **Start Command:** `npm start`
3. Under **Environment**, add `DATABASE_URL` with your Supabase connection string.

---

## Troubleshooting

- **`Can't reach database server`**: free Supabase projects pause after a week without activity. Open the Supabase dashboard and click **Restore**.
- **`password authentication failed`**: check the password in `DATABASE_URL`, and make sure the `[` `]` brackets were removed.
- **Chart or rainbow doesn't show**: open the browser console (F12) and look for errors.
- **Installing Prisma yourself?** Use version 7: `npm install prisma@7 @prisma/client@7 @prisma/adapter-pg@7`.

---

## Try It Yourself

- Add an `age` field to the model and the form
- Show the percentage for each color on the dashboard
- Use `mouseX` in the p5 sketch to animate the rainbow
- Add an **Edit** button that changes a person's color
- Add a new color (like `pink`) to `prisma/seed.js`, run `npm run db:seed`, and watch it appear in the relational form
- Try deleting a `Color` in Prisma Studio (`npm run db:studio`) that people still use. What happens, and why?
