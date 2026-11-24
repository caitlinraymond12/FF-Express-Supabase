var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var hbs = require('hbs');
const crypto = require('crypto');
const port = process.env.PORT || 3000;



require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false })); 
app.use(express.static(path.join(__dirname, 'public')));

const AGE_OPTIONS = Array.from({ length: 83 }, function (_, index) {
  return index + 18;
});

const AGE_GROUPS = [
  { label: '0-17', matches: age => age <= 17 },
  { label: '18-34', matches: age => age >= 18 && age <= 34 },
  { label: '35-64', matches: age => age >= 35 && age <= 64 },
  { label: '65+', matches: age => age >= 65 }
];

async function getCountryVisitStats() {
  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' },
    include: {
      people: {
        select: { person: { select: { age: true } } }
      },
      wantedBy: {
        select: { person: { select: { age: true } } }
      }
    }
  });

  return countries.map(country => {
    const ageGroups = Object.fromEntries(
      AGE_GROUPS.map(group => [
        group.label,
        country.people.filter(entry => group.matches(entry.person.age)).length
      ])
    );
    const wantedAgeGroups = Object.fromEntries(
      AGE_GROUPS.map(group => [
        group.label,
        country.wantedBy.filter(entry => group.matches(entry.person.age)).length
      ])
    );

    return {
      code: country.code,
      name: country.name,
      visits: country.people.length,
      wants: country.wantedBy.length,
      ageGroups: ageGroups,
      wantedAgeGroups: wantedAgeGroups
    };
  });
}

app.get('/', async function (req, res, next) {
  try {
    const countryCounts = await getCountryVisitStats();
    const dashboardToken = typeof req.query.person === 'string' ? req.query.person : '';
    const person = dashboardToken
      ? await prisma.person.findUnique({
        where: { dashboardToken: dashboardToken },
        select: { name: true, dashboardToken: true }
      })
      : null;

    res.render('index', {
      title: 'Countries Visited',
      countries: countryCounts,
      ageOptions: AGE_OPTIONS,
      countryCountsJSON: JSON.stringify(countryCounts),
      person: person,
      submitted: Boolean(person)
    });
  } catch (err) {
    next(err);
  }
});

app.post('/', async function (req, res, next) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const ageValue = typeof req.body.age === 'string' ? req.body.age.trim() : '';
    const age = Number(ageValue);

    const submittedVisitedCodes = req.body.visitedCountryCodes;
    const submittedWantedCodes = req.body.wantedCountryCodes;
    const visitedCodes = submittedVisitedCodes === undefined
      ? []
      : Array.isArray(submittedVisitedCodes) ? submittedVisitedCodes : [submittedVisitedCodes];
    const wantedCodes = submittedWantedCodes === undefined
      ? []
      : Array.isArray(submittedWantedCodes) ? submittedWantedCodes : [submittedWantedCodes];

    if (!name || !ageValue || !Number.isInteger(age) || age < 0 || age > 100 ||
      visitedCodes.length + wantedCodes.length === 0 ||
      visitedCodes.concat(wantedCodes).some(code => typeof code !== 'string')) {
      return res.redirect('/');
    }

    const uniqueVisitedCodes = [...new Set(visitedCodes)];
    const uniqueWantedCodes = [...new Set(wantedCodes)];
    const uniqueCountryCodes = [...new Set(uniqueVisitedCodes.concat(uniqueWantedCodes))];
    const countries = await prisma.country.findMany({
      where: { code: { in: uniqueCountryCodes } },
      select: { id: true, code: true }
    });

    if (countries.length !== uniqueCountryCodes.length) {
      return res.redirect('/');
    }

    const countryIdByCode = new Map(countries.map(country => [country.code, country.id]));
    const dashboardToken = crypto.randomBytes(32).toString('hex');
    await prisma.person.create({
      data: {
        name: name,
        age: age,
        dashboardToken: dashboardToken,
        countries: {
          create: uniqueVisitedCodes.map(code => ({
            country: { connect: { id: countryIdByCode.get(code) } }
          }))
        },
        wantedCountries: {
          create: uniqueWantedCodes.map(code => ({
            country: { connect: { id: countryIdByCode.get(code) } }
          }))
        }
      }
    });

    res.redirect('/?person=' + encodeURIComponent(dashboardToken));
  } catch (err) {
    next(err);
  }
});


app.get('/dashboard/:dashboardToken', async function (req, res, next) {
  try {
    const person = await prisma.person.findUnique({
      where: { dashboardToken: req.params.dashboardToken },
      select: {
        name: true,
        age: true,
        dashboardToken: true,
        countries: {
          select: { country: { select: { name: true } } },
          orderBy: { country: { name: 'asc' } }
        },
        wantedCountries: {
          select: { country: { select: { name: true } } },
          orderBy: { country: { name: 'asc' } }
        }
      }
    });

    if (!person) {
      return next(createError(404, 'Personal dashboard not found'));
    }

    res.render('person-dashboard', {
      title: person.name + "'s Dashboard",
      person: person
    });
  } catch (err) {
    next(err);
  }
});

/* Dashboard: country visit counts */
app.get('/dashboard', async function (req, res, next) {
  try {
    const countryCounts = await getCountryVisitStats();

    res.render('dashboard', {
      title: 'Dashboard',
      countryCountsJSON: JSON.stringify(countryCounts)
    });
  } catch (err) {
    next(err);
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, function () {
  console.log('Server running on http://localhost:' + port);
});
