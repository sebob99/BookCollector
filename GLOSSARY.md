# BookCollector

A personal app for finding books and keeping a private, on-device list of the ones you own or care about.

## Language

**Collection**:
The user's personal list of books, stored only on their device.
_Avoid_: Library, shelf, wishlist, favorites

**Search result**:
A book found in the external book catalog that may or may not be in the Collection yet.
_Avoid_: Hit, listing

**Book**:
One entry in the Collection, combining catalog data (title, authors, cover, year, ISBN) with the user's own data.
_Avoid_: Item, volume, title

**Reading status**:
Where a Book stands for the user: Want to read, Reading, or Read.
_Avoid_: State, progress, shelf

**Rating**:
The user's optional 1–5 star score for a Book.
_Avoid_: Review, score

**Note**:
The user's optional free text about a Book.
_Avoid_: Comment, review

**Owned**:
Whether the user physically has a Book, independent of its Reading status.
_Avoid_: Bought, in library, have

**Duplicate**:
A scanned or found book whose ISBN matches an Owned Book already in the Collection.
_Avoid_: Double, copy, already added

**Series**:
A named, numbered run of Books, such as a manga or a novel cycle.
_Avoid_: Reihe, saga, collection, set

**Volume number**:
A Book's position within its Series. A Book is never itself called a volume.
_Avoid_: Band, issue, part, index

**Catalog**:
The external source of book data that searches run against.
_Avoid_: Database, API, source
