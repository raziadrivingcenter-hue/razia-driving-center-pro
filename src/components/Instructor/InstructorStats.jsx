function InstructorStats() {
  const stats = [
    
    
    
  ];

  return (
    <div className="mt-10 grid grid-cols-3 gap-5">

      {stats.map((item) => (

        <div
          key={item.label}
          className="
            rounded-2xl
            border
            border-orange-100
            bg-white
            p-5
            text-center
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-2
            hover:shadow-xl
          "
        >

          <h3 className="text-3xl font-black text-[#FF6201]">
            {item.number}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {item.label}
          </p>

        </div>

      ))}

    </div>
  );
}

export default InstructorStats;