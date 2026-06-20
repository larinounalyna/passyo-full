import "./profile_info.css";

type ProfileInfoProps = {
  name: string;
  title: string;
  photoUrl: string;
};

export default function ProfileInfo({
  name,
  title,
  photoUrl,
}: ProfileInfoProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="profile-widget">
      <div className="profile-widget-avatar">
        {photoUrl && (
          <img
            src={photoUrl}
            alt={name}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span aria-hidden="true">{initials}</span>
      </div>
      <div className="profile-widget-text">
        <span className="profile-widget-name">{name}</span>
        <span className="profile-widget-role">{title}</span>
      </div>
    </div>
  );
}
