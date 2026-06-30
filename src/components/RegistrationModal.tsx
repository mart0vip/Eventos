"use client";

import { useState } from "react";
import { X, Ticket, Minus, Plus } from "lucide-react";
import { Event } from "@/types/event";
import { registerForEvent } from "@/store/events";

interface RegistrationModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrationModal({
  event,
  onClose,
  onSuccess,
}: RegistrationModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tickets, setTickets] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const spotsLeft = event.capacity - event.registered;
  const maxTickets = Math.min(spotsLeft, 10);
  const totalPrice = event.price * tickets;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      registerForEvent({
        eventId: event.id,
        name,
        email,
        phone,
        tickets,
        notes,
      });
      setSubmitting(false);
      onSuccess();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-saddle text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Ticket size={20} />
            <span className="text-leather-light font-medium text-sm">
              Event Registration
            </span>
          </div>
          <h2 className="font-heading text-xl font-bold">{event.title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stable mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stable mb-1.5">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stable mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stable mb-1.5">
              Number of Tickets
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setTickets(Math.max(1, tickets - 1))}
                className="w-10 h-10 rounded-full border-2 border-dust flex items-center justify-center hover:border-saddle hover:text-saddle transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="text-2xl font-bold text-stable w-8 text-center">
                {tickets}
              </span>
              <button
                type="button"
                onClick={() => setTickets(Math.min(maxTickets, tickets + 1))}
                className="w-10 h-10 rounded-full border-2 border-dust flex items-center justify-center hover:border-saddle hover:text-saddle transition-colors"
              >
                <Plus size={16} />
              </button>
              <span className="text-sm text-stable-light">
                ({spotsLeft} spots available)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stable mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or dietary needs..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="bg-cream-dark rounded-xl p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stable-light">
                {event.price === 0 ? "Free admission" : `$${event.price} x ${tickets} ticket${tickets > 1 ? "s" : ""}`}
              </span>
              <span className="font-bold text-stable">
                {totalPrice === 0 ? "FREE" : `$${totalPrice}`}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || spotsLeft === 0}
            className="btn-green w-full justify-center py-3.5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">🐴</span>
                Processing...
              </span>
            ) : (
              <>
                <Ticket size={20} />
                {spotsLeft === 0
                  ? "Sold Out"
                  : totalPrice === 0
                    ? "Register for Free"
                    : `Register - $${totalPrice}`}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
