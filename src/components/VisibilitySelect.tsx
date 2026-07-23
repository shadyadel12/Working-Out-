import type { LibraryVisibility } from "../api/publicLibrary";

export default function VisibilitySelect({
  value,
  onChange,
}: {
  value: LibraryVisibility;
  onChange: (value: LibraryVisibility) => void;
}) {
  const arabic =
    document.documentElement.dir === "rtl" ||
    document.documentElement.lang.startsWith("ar");
  return (
    <label className="field library-visibility-field">
      <span>{arabic ? "الظهور" : "Visibility"}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as LibraryVisibility)}
      >
        <option value="private">
          {arabic
            ? "خاص — لك ولفريقك المصرح له"
            : "Private — you and authorized team members"}
        </option>
        <option value="public">
          {arabic
            ? "عام — متاح لكل المدربين فوراً"
            : "Public — immediately available to every coach"}
        </option>
      </select>
    </label>
  );
}
