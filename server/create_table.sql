CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL, -- Title of the event
    event_date DATE NOT NULL, -- Date of the concert
    start_time TIMESTAMPTZ NOT NULL, -- start time of the event with timezone info (for localization in the future)
    venue_name TEXT,
    venue_address TEXT NOT NULL,
    neighborhood TEXT,
    image_uri TEXT,
    ticket_price NUMERIC(10,2), -- ticket price which can be up to 10 digits including 2 decimal places, e.g. XXXXXXXX.XX
    attendees INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_genres (
    event_id BIGINT references events(id),
    genre 
)