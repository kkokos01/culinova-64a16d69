
interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="text-center mb-10">
      <h1 className="text-4xl font-display font-semibold text-slate-800 mb-4">
        {title}
      </h1>
      <p className="text-slate-600 max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  );
};

export default PageHeader;
