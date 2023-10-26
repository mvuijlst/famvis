d3.json("data.json").then(data => {
    addChildEvents(data);
    processPeopleData(data);
    const arrangedPeople = arrangePeople(data.people);

    //console.log(arrangedPeople);


    const svg = d3.select("body")
        .append("svg")
        .attr("width", window.innerWidth)
        .attr("height", 1000);
    const gap = 10;
    const boxHeight = 50;

    const defs = svg.append("defs");

    // Gradient for estimated birth (white to transparent)
    const birthGradient = defs.append("linearGradient")
        .attr("id", "birthGradient")
        .attr("x1", "10%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    birthGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);

    birthGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 0);


    // Gradient for estimated death (transparent to white)
    const deathGradient = defs.append("linearGradient")
        .attr("id", "deathGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    deathGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 0);

    deathGradient.append("stop")
        .attr("offset", "95%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);


    // Function to draw or update the visual
    function drawVisual() {
        const svgWidth = window.innerWidth;

        // Get min and max birth and death years
        const minBirthYear = d3.min(arrangedPeople, d => d.birth_year);
        const maxDeathYear = d3.max(arrangedPeople, d => d.death_year);

        // Round to nearest decade
        const roundedMinBirth = Math.floor(minBirthYear / 10) * 10;
        const roundedMaxDeath = Math.ceil(maxDeathYear / 10) * 10;

        const birthYearScale = d3.scaleLinear()
            .domain([roundedMinBirth, roundedMaxDeath])
            .range([0, svgWidth - 50]);

        // Calculate the total height required
        const totalHeight = arrangedPeople.length * (boxHeight + gap) + gap + 100;

        // Adjust SVG height
        svg.attr("height", totalHeight);

        // Clear the existing rects and text
        svg.selectAll("rect").remove();
        svg.selectAll("text").remove();
        svg.selectAll(".decade-line").remove();


        // Draw vertical lines for every 10 years
        for (let year = roundedMinBirth; year <= roundedMaxDeath; year += 10) {
            svg.append("line")
                .attr("class", "decade-line")
                .attr("x1", birthYearScale(year))
                .attr("y1", 0)
                .attr("x2", birthYearScale(year))
                .attr("y2", 1000) // the height of your SVG
                .attr("stroke", "#d3d3d3") // light gray, you can change this
                .attr("stroke-width", 1);
        }

        // Draw rects
        let strokeWidth = 2;

        svg.selectAll("rect")
            .data(arrangedPeople)
            .enter()
            .append("rect")
            .attr("x", d => Math.round(birthYearScale(d.birth_year) + (strokeWidth / 2)))
            .attr("y", (d, i) => Math.round(i * (boxHeight + gap) + 50 + (strokeWidth / 2)))
            .attr("width", d => Math.round(birthYearScale(d.death_year) - birthYearScale(d.birth_year) - strokeWidth))
            .attr("height", Math.round(boxHeight - strokeWidth))
            .attr("fill", d => d.Gender === "male" ? "lightblue" : "pink")
            .attr("stroke", d => d.Gender === "male" ? "#1e64c8" : "#dc4e28")
            .attr("stroke-width", strokeWidth)
            .attr("stroke-linecap", "square"); // Ensure the stroke edges are squared

        // Uncertainty rectangles for estimated birth dates
        svg.selectAll(".estimated-birth")
            .data(arrangedPeople.filter(d => d.estimated_birth && d.first_event_year))
            .enter()
            .append("rect")
            .attr("x", d => Math.round(birthYearScale(d.birth_year))-2)
            .attr("y", d => Math.round(getYPosition(d)))
            .attr("height", Math.round(boxHeight))
            .attr("width", d => Math.round(birthYearScale(d.first_event_year) - birthYearScale(d.birth_year)))
            .attr("fill", "url(#birthGradient)");

        svg.selectAll(".estimated-death")
            .data(arrangedPeople.filter(d => d.estimated_death && d.last_event_year))
            .enter()
            .append("rect")
            .attr("x", d => Math.round(birthYearScale(d.last_event_year)))
            .attr("y", d => Math.round(getYPosition(d)))
            .attr("height", Math.round(boxHeight))
            .attr("width", d => Math.round(birthYearScale(d.death_year) - birthYearScale(d.last_event_year))+2)
            .attr("fill", "url(#deathGradient)");





        // Draw text
        svg.selectAll("text")
            .data(arrangedPeople)
            .enter()
            .append("text")
            .attr("x", d => {
                const start = birthYearScale(d.birth_year);
                const end = birthYearScale(d.death_year);
                if (d.estimated_birth && !d.estimated_death) {
                    return end - 10;
                } else if (!d.estimated_birth && d.estimated_death) {
                    return start + 10;
                } else if (d.estimated_birth && d.estimated_death) {
                    return start + (end - start) / 2;
                } else { // both dates are known
                    return start + 10;
                }
            })
            .attr("y", (d, i) => i * (boxHeight + gap) + 75)
            .attr("dy", ".35em")
            .attr("text-anchor", d => {
                if (d.estimated_birth && !d.estimated_death) {
                    return "end";
                } else if (!d.estimated_birth && d.estimated_death) {
                    return "start";
                } else if (d.estimated_birth && d.estimated_death) {
                    return "middle";
                } else { // both dates are known
                    return "start";
                }
            })
            .text(d => `${d.First_names} ${d.Lastname} ${getLifeSpan(d)}`);


        function getYPosition(person) {
            const index = arrangedPeople.findIndex(d => d.ID === person.ID);
            return index * (boxHeight + gap) + 50;
        }
    }

    // Call the function initially
    drawVisual();

    // Redraw visualization on window resize
    window.addEventListener("resize", function () {
        svg.attr("width", window.innerWidth);
        drawVisual();
    });
});




function extractYear(dateStr) {
    return parseInt(dateStr.split('-')[0]);
}

function getEventBounds(personID, data) {
    // Fetch all events related to the person (including partner and child events)
    let events = data.events.filter(event =>
        event.person_ID === personID ||
        event.partner_ID === personID ||
        event.child_ID === personID // Consider child events too
    );

    if (events.length === 0) return {
        earliest: null,
        latest: null
    };

    // Sort them by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
        earliest: events[0],
        latest: events[events.length - 1]
    };
}


function addChildEvents(data) {
    data.people.forEach(child => {
        if (child.father_ID || child.mother_ID) { // At least one parent is known
            let birthEvent = data.events.find(event => event.person_ID === child.ID && event.type === 'birth');

            if (birthEvent) {
                if (child.father_ID) {
                    data.events.push({
                        person_ID: child.father_ID,
                        type: 'child',
                        date: birthEvent.date,
                        place: birthEvent.place,
                        child_ID: child.ID
                    });
                }
                if (child.mother_ID) {
                    data.events.push({
                        person_ID: child.mother_ID,
                        type: 'child',
                        date: birthEvent.date,
                        place: birthEvent.place,
                        child_ID: child.ID
                    });
                }
            }
        }
    });
}




function processPeopleData(data) {

    const currentYear = new Date().getFullYear();

    // Adding birth and death years to each person
    data.people.forEach(person => {
        // Initialize flags
        person.estimated_birth = false;
        person.estimated_death = false;
        person.estimated_marriage = false;
        // initialise first & last events
        person.first_event_year = false;
        person.last_event_year = false;

        // Find the corresponding events
        let birthEvent = data.events.find(event => event.person_ID === person.ID && event.type === 'birth');
        let marriageEvent = findMarriageEvent(person.ID, data);
        let deathEvent = data.events.find(event => event.person_ID === person.ID && event.type === 'death');
        let eventBounds = getEventBounds(person.ID, data);

        if (marriageEvent) {
            person.marriage_year = extractYear(marriageEvent.date);
        } else {
            person.marriage_year = estimateMarriageYear(person, data, eventBounds);
            if (person.marriage_year) {
                person.estimated_marriage = true;
            }
        }

        if (birthEvent) {
            person.birth_year = extractYear(birthEvent.date);
        } else {
            person.birth_year = estimateBirthYear(person, data, eventBounds);
            person.estimated_birth = true;
        }

        if (deathEvent) {
            person.death_year = extractYear(deathEvent.date);
        } else {
            person.death_year = estimateDeathYear(person, data, eventBounds);
            person.estimated_death = true;
        }

        // If person is born less than 75 years ago and death date is estimated, add an "alive?" event
        if ((currentYear - person.birth_year) < 75 && person.estimated_death) {
            data.events.push({
                person_ID: person.ID,
                type: 'alive?',
                date: `${currentYear}-01-01`,
                place: null // or whatever default value you want
            });
            person.last_event_year = currentYear;
        } else {
            if (eventBounds.earliest) {
                person.first_event_year = extractYear(eventBounds.earliest.date);
                person.last_event_year = extractYear(eventBounds.latest.date);
            } else {
                person.first_event_year = person.birth_year;
                person.last_event_year = person.birth_year + 75;
            }
        }
    });
}

function findMarriageEvent(personID, data) {
    return data.events.find(event =>
        (event.person_ID === personID || event.partner_ID === personID) &&
        event.type === 'marriage'
    );
}

function birthViaParentMarriage(person, data) {
    let parentsBirthYears = [];

    if (person.father_ID !== null) {
        let father = data.people.find(p => p.ID === person.father_ID);
        if (father && father.birth_year) {
            parentsBirthYears.push(father.birth_year);
        }
    }

    if (person.mother_ID !== null) {
        let mother = data.people.find(p => p.ID === person.mother_ID);
        if (mother && mother.birth_year) {
            parentsBirthYears.push(mother.birth_year);
        }
    }

    if (parentsBirthYears) {

        parentsBirthYears.sort((a, b) => b - a);
        let youngestParentsBirthYear = parentsBirthYears[0];

        if (youngestParentsBirthYear) return youngestParentsBirthYear + 20;

        let parentMarriageEvent = findMarriageEvent((person.father_ID || person.mother_ID), data);
        if (parentMarriageEvent) {
            return extractYear(parentMarriageEvent.date) + 1;
        }
    } else {
        return undefined;
    }
}


function estimateBirthYear(person, data, eventBounds) {
    let deathEvent = data.events.find(event => event.person_ID === person.ID && event.type === 'death');
    let marriageEvent = findMarriageEvent(person.ID, data);
    let earliestEvent = eventBounds.earliest;

    let estimatedBirthYear;

    if (deathEvent) {
        estimatedBirthYear = extractYear(deathEvent.date) - 75;
    } else if (marriageEvent) {
        estimatedBirthYear = extractYear(marriageEvent.date) - 20;
    } else {
        estimatedBirthYear = birthViaParentMarriage(person, data);
    }

    if (earliestEvent && extractYear(earliestEvent.date) < estimatedBirthYear) {
        estimatedBirthYear = extractYear(earliestEvent.date) - 5;
    }

    return estimatedBirthYear;
}

function estimateMarriageYear(person, data) {
    let childEvents = data.events.filter(event => (event.type === 'child') &&
        (event.person_ID === person.ID));

    if (childEvents.length === 0) return undefined;

    let youngestChildEvent = childEvents.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return extractYear(youngestChildEvent.date) - 1;

}

function estimateDeathYear(person, data, eventBounds) {
    let currentYear = new Date().getFullYear();
    let birthEvent = data.events.find(event => event.person_ID === person.ID && event.type === 'birth');
    let marriageEvent = findMarriageEvent(person.ID, data);
    let latestEvent = eventBounds.latest;

    let estimatedDeathYear;

    if (birthEvent) {
        estimatedDeathYear = extractYear(birthEvent.date) + 75;
    } else if (marriageEvent) {
        estimatedDeathYear = extractYear(marriageEvent.date) + 50;
    } else if (birthViaParentMarriage(person, data)) {
        return birthViaParentMarriage(person, data) + 75;
    } else {
        return undefined; // If neither birth nor marriage events are found nor parent estimated marriage date, we don't provide an estimation
    }

    if (latestEvent && extractYear(latestEvent.date) > estimatedDeathYear) {
        estimatedDeathYear = extractYear(latestEvent.date) + 5;
    }


    if (estimatedDeathYear <= currentYear && currentYear - estimatedDeathYear <= 10) {
        estimatedDeathYear = currentYear + 5;
    }

    return estimatedDeathYear;
}

function getLifeSpan(person) {
    birthyear = !person.estimated_birth ? person.birth_year : null;
    deathyear = !person.estimated_death ? person.death_year : null;
    if (birthyear && deathyear) {
        return `(${birthyear}-${deathyear})`;
    } else if (birthyear) {
        return `(°${birthyear})`;
    } else if (deathyear) {
        return `(†${deathyear})`;
    } else {
        return '';
    }
}

function arrangePeople(data) {
    let arranged = [];
    let addedIDs = new Set(); // To keep track of added individuals

    function findSpouse(person) {
        return data.find(ind => {
            if (ind.ID === person.ID) return false; // A person can't be their own spouse

            // If the two individuals have a common child, they are considered spouses
            return data.some(child => (child.father_ID === person.ID && child.mother_ID === ind.ID) || (child.mother_ID === person.ID && child.father_ID === ind.ID));
        });
    }

    function getFamily(person) {
        let family = [];

        if (addedIDs.has(person.ID)) {
            return family;
        }

        family.push(person);
        addedIDs.add(person.ID);

        // Find spouse
        let spouse = findSpouse(person);
        if (spouse && !addedIDs.has(spouse.ID)) {
            family.push(spouse);
            addedIDs.add(spouse.ID);
        }

        // Find children
        let children = data.filter(ind => (ind.father_ID === person.ID || ind.mother_ID === person.ID) && !addedIDs.has(ind.ID));
        children.forEach(child => {
            family = family.concat(getFamily(child));
        });

        return family;
    }

    // Sort the data by birth date
    let sortedByBirth = [...data];
    sortedByBirth.sort((a, b) => {
        return a.birth_year - b.birth_year;
    });

    // Build families based on sorted data
    sortedByBirth.forEach(person => {
        arranged = arranged.concat(getFamily(person));
    });

    return arranged;
}









function displayResults(data) {
    // Create a div container for results
    let container = d3.select('body').append('div').attr('class', 'results-container');

    // Iterate over each person and display their information
    data.people.forEach(person => {
        let personDiv = container.append('div').attr('class', 'person');

        personDiv.append('p').text(`Name: ${person.First_names} ${person.Lastname}`);
        personDiv.append('p').text(`Gender: ${person.Gender}`);
        personDiv.append('p').text(`Birth Year: ${person.birth_year} ${person.estimated_birth ? '(Estimated)' : ''}`);
        personDiv.append('p').text(`Death Year: ${person.death_year ? person.death_year : 'N/A'} ${person.estimated_death ? '(Estimated)' : ''}`);
        personDiv.append('p').text(`Marriage Year: ${person.marriage_year ? person.marriage_year : 'N/A'} ${person.estimated_marriage ? '(Estimated)' : ''}`);

    });
}