export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  grade: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  classId: string;
  active: boolean;
};

export type ParishClass = {
  id: string;
  name: string;
  teacher: string;
  day: string;
  time: string;
  color: string;
  icon: string;
};

export type AttendanceRecord = {
  date: string;
  studentId: string;
  present: boolean;
};

export const CLASSES: ParishClass[] = [
  { id: "c1", name: "First Communion", teacher: "Mrs. Rodriguez", day: "Saturday", time: "9:00 AM", color: "#4A7FA5", icon: "🕊️" },
  { id: "c2", name: "Confirmation", teacher: "Mr. Thompson", day: "Wednesday", time: "6:30 PM", color: "#6BAA75", icon: "✝️" },
  { id: "c3", name: "RCIA", teacher: "Deacon Martinez", day: "Tuesday", time: "7:00 PM", color: "#C9943A", icon: "📖" },
  { id: "c4", name: "Youth Ministry", teacher: "Ms. O'Brien", day: "Friday", time: "5:00 PM", color: "#D4856A", icon: "⭐" },
  { id: "c5", name: "Adult Faith Formation", teacher: "Fr. Patrick", day: "Thursday", time: "7:30 PM", color: "#7B68A8", icon: "🙏" },
  { id: "c6", name: "Children's Liturgy", teacher: "Mrs. Chen", day: "Sunday", time: "10:00 AM", color: "#5B8A8B", icon: "📚" },
];

export const STUDENTS: Student[] = [
  { id: "s1",  firstName: "Emily",   lastName: "Sanchez",   dob: "2014-03-12", grade: "5th", parentName: "Maria Sanchez",   parentEmail: "msanchez@email.com",   parentPhone: "(555) 201-4832", classId: "c1", active: true },
  { id: "s2",  firstName: "Liam",    lastName: "O'Connor",  dob: "2013-07-22", grade: "6th", parentName: "Patrick O'Connor", parentEmail: "poconnor@email.com",   parentPhone: "(555) 334-7291", classId: "c1", active: true },
  { id: "s3",  firstName: "Sofia",   lastName: "Reyes",     dob: "2014-11-05", grade: "5th", parentName: "Carlos Reyes",    parentEmail: "creyes@email.com",     parentPhone: "(555) 448-5630", classId: "c1", active: true },
  { id: "s4",  firstName: "Noah",    lastName: "Kim",       dob: "2014-01-30", grade: "5th", parentName: "Ji-Young Kim",    parentEmail: "jykim@email.com",      parentPhone: "(555) 562-0194", classId: "c1", active: true },
  { id: "s5",  firstName: "Isabella","lastName": "Morales", dob: "2014-08-18", grade: "5th", parentName: "Rosa Morales",    parentEmail: "rmorales@email.com",   parentPhone: "(555) 673-2847", classId: "c1", active: true },
  { id: "s6",  firstName: "Ethan",   lastName: "Walsh",     dob: "2008-05-14", grade: "10th",parentName: "Sean Walsh",       parentEmail: "swalsh@email.com",     parentPhone: "(555) 784-3961", classId: "c2", active: true },
  { id: "s7",  firstName: "Olivia",  lastName: "Fernandez", dob: "2007-09-28", grade: "11th",parentName: "Elena Fernandez",  parentEmail: "efernandez@email.com", parentPhone: "(555) 895-7423", classId: "c2", active: true },
  { id: "s8",  firstName: "Mason",   lastName: "Brooks",    dob: "2008-02-11", grade: "10th",parentName: "David Brooks",     parentEmail: "dbrooks@email.com",    parentPhone: "(555) 106-8534", classId: "c2", active: true },
  { id: "s9",  firstName: "Ava",     lastName: "Murphy",    dob: "2007-12-03", grade: "11th",parentName: "Claire Murphy",    parentEmail: "cmurphy@email.com",    parentPhone: "(555) 217-9645", classId: "c2", active: true },
  { id: "s10", firstName: "James",   lastName: "Nguyen",    dob: "2008-06-20", grade: "10th",parentName: "Linh Nguyen",      parentEmail: "lnguyen@email.com",    parentPhone: "(555) 328-0756", classId: "c2", active: true },
  { id: "s11", firstName: "Charlotte","lastName":"Kowalski", dob: "1985-04-09", grade: "Adult",parentName: "Self",            parentEmail: "ckowalski@email.com",  parentPhone: "(555) 439-1867", classId: "c3", active: true },
  { id: "s12", firstName: "Benjamin","lastName": "Harris",  dob: "1990-10-17", grade: "Adult",parentName: "Self",            parentEmail: "bharris@email.com",    parentPhone: "(555) 540-2978", classId: "c3", active: true },
  { id: "s13", firstName: "Mia",     lastName: "Torres",    dob: "2009-07-25", grade: "9th", parentName: "Luis Torres",     parentEmail: "ltorres@email.com",    parentPhone: "(555) 651-3089", classId: "c4", active: true },
  { id: "s14", firstName: "Lucas",   lastName: "Martin",    dob: "2010-03-08", grade: "8th", parentName: "Anne Martin",     parentEmail: "amartin@email.com",    parentPhone: "(555) 762-4190", classId: "c4", active: true },
  { id: "s15", firstName: "Amelia",  lastName: "Scott",     dob: "2016-09-14", grade: "2nd", parentName: "Robert Scott",    parentEmail: "rscott@email.com",     parentPhone: "(555) 873-5201", classId: "c6", active: true },
  { id: "s16", firstName: "Logan",   lastName: "White",     dob: "2016-01-22", grade: "2nd", parentName: "Sarah White",     parentEmail: "swhite@email.com",     parentPhone: "(555) 984-6312", classId: "c6", active: true },
];

export const generateAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const dates = ["2026-05-03", "2026-05-10", "2026-05-17", "2026-05-24", "2026-05-31"];
  STUDENTS.forEach(student => {
    dates.forEach(date => {
      records.push({ date, studentId: student.id, present: Math.random() > 0.2 });
    });
  });
  return records;
};

export const ATTENDANCE_RECORDS: AttendanceRecord[] = generateAttendance();
