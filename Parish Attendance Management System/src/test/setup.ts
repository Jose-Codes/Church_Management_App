import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollTo, and TeacherView calls it on the roster
// container when jumping to a past session.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}
