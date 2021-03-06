import React from "react";
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";

export const DeckDropdown = ({ selectedDeck, decks, setSelected }) => {
  return (
    <UncontrolledDropdown>
      <DropdownToggle block caret>
        {selectedDeck
          ? `Deck ${decks.find(d => d.id === selectedDeck).number}`
          : "Select Deck"}
      </DropdownToggle>
      <DropdownMenu>
        {decks
          .concat()
          .sort((a, b) => {
            if (a.number < b.number) return -1;
            if (b.number < a.number) return 1;
            return 0;
          })
          .map(d =>
            <DropdownItem
              key={d.id}
              onClick={() => {
                setSelected({ deck: d.id, room: null });
              }}
            >{`Deck ${d.number}`}</DropdownItem>
          )}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

export const RoomDropdown = ({
  selectedDeck,
  otherSelected,
  selectedRoom,
  decks,
  setSelected
}) => {
  return (
    <UncontrolledDropdown>
      <DropdownToggle block caret>
        {selectedRoom
          ? decks
              .find(d => d.id === selectedDeck)
              .rooms.find(r => r.id === selectedRoom).name
          : "Select Room"}
      </DropdownToggle>
      {selectedDeck &&
        <DropdownMenu>
          <DropdownItem header>
            Deck {decks.find(d => d.id === selectedDeck).number}
          </DropdownItem>
          {decks.find(d => d.id === selectedDeck).rooms.map(r =>
            <DropdownItem
              key={r.id}
              disabled={r.id === otherSelected}
              onClick={() => {
                setSelected({ room: r.id });
              }}
            >
              {r.name}
            </DropdownItem>
          )}
        </DropdownMenu>}
    </UncontrolledDropdown>
  );
};
