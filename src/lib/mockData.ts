export interface Meeting {
  id: string;
  title: string;
  organizer: string;
  startTime: Date;
  endTime: Date;
  checkedIn?: boolean;
}

export interface Room {
  id: string;
  name: string;
  floor: string;
  capacity: number;
}

export const MOCK_ROOM: Room = {
  id: "room-1",
  name: "Apollo",
  floor: "3rd Floor",
  capacity: 10,
};

const today = new Date();
const h = (hour: number, min = 0) => {
  const d = new Date(today);
  d.setHours(hour, min, 0, 0);
  return d;
};

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "Sprint Planning",
    organizer: "Kovács Péter",
    startTime: h(9, 0),
    endTime: h(10, 0),
  },
  {
    id: "m2",
    title: "Design Review",
    organizer: "Nagy Anna",
    startTime: h(10, 30),
    endTime: h(11, 30),
  },
  {
    id: "m3",
    title: "Client Demo",
    organizer: "Szabó Márk",
    startTime: h(13, 0),
    endTime: h(14, 0),
  },
  {
    id: "m4",
    title: "Retrospective",
    organizer: "Tóth Éva",
    startTime: h(15, 0),
    endTime: h(15, 30),
  },
];
