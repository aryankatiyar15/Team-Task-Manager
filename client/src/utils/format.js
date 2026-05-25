export function formatDate(value) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

export function getErrorMessage(error) {
  if (error?.details?.length) {
    return error.details.map((detail) => detail.message).join(", ");
  }

  return error?.message || "Something went wrong";
}
