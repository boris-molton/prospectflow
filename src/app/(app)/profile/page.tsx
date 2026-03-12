import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="mt-1 text-slate-600">
          Ces informations aident l&apos;IA à personnaliser tes emails de candidature
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
