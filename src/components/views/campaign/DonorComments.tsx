interface Comment {
  donor: string;
  amount: number;
  date: string;
  comment: string;
}

interface DonorCommentsProps {
  comments: Comment[];
}

export function DonorComments({ comments }: DonorCommentsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49]">
        Palabras de apoyo de donadores
      </h2>
      <p className="text-gray-600">
        Realiza tu aporte y comparte palabras de apoyo a esta causa.
      </p>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div
            key={`${comment.donor}-${comment.date}`}
            className="border-b border-gray-200 pb-6 last:border-0"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="h-10 w-10 rounded-full bg-[#e8f0e9] flex items-center justify-center">
                <span className="text-sm font-medium text-[#2c6e49]">
                  {comment.donor[0]}
                </span>
              </div>
              <div>
                <h3 className="font-medium">{comment.donor}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Bs. {comment.amount}</span>
                  <span>•</span>
                  <span>{comment.date}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-600">{comment.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
