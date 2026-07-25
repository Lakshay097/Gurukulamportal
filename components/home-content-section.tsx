interface HomeContentSectionProps {
  heading: string;
  body: string;
}

export function HomeContentSection({ heading, body }: HomeContentSectionProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm p-8">
      <h2 className="mb-4 text-3xl font-bold text-gray-900 font-heading">
        {heading}
      </h2>
      <p className="text-lg text-gray-600 leading-relaxed">
        {body}
      </p>
    </div>
  );
}
